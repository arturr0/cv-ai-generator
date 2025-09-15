import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import next from 'next';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cliSpinners from 'cli-spinners';
import readline from 'readline';
import chalk from 'chalk';
import { generatePDF } from './utils/pdf.js';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dev = process.env.NODE_ENV !== 'production';
const appNext = next({ dev });
const handle = appNext.getRequestHandler();
const PORT = process.env.PORT || 3000;

// Constants
const JOOBLE_API_URL = 'https://pl.jooble.org/api';
const CV_DIR = path.join(__dirname, 'public', 'cvs');
const CUSTOM_TEMPLATES_DIR = path.join(__dirname, 'templates', 'custom');

// Ensure directories exist
if (!fs.existsSync(CV_DIR)) fs.mkdirSync(CV_DIR, { recursive: true });
if (!fs.existsSync(CUSTOM_TEMPLATES_DIR)) fs.mkdirSync(CUSTOM_TEMPLATES_DIR, { recursive: true });

await appNext.prepare();
const app = express();
app.use(express.json());
app.use((req, res, next) => {
    console.log(chalk.gray(`[${new Date().toISOString()}] ${req.method} ${req.path}`));
    next();
});

// -------------------- Helpers --------------------
function sanitizeFilename(str) {
    return str.replace(/[^a-z0-9-]/gi, '-').toLowerCase().substring(0, 50);
}

function createSpinner(text) {
    const spinner = cliSpinners.dots;
    let i = 0;

    const interval = setInterval(() => {
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${spinner.frames[i]} ${text}`);
        i = (i + 1) % spinner.frames.length;
    }, spinner.interval);

    return {
        stop: (message) => {
            clearInterval(interval);
            readline.cursorTo(process.stdout, 0);
            readline.clearLine(process.stdout, 0);
            console.log(chalk.green('✓') + ` ${message}`);
        },
        fail: (message) => {
            clearInterval(interval);
            readline.cursorTo(process.stdout, 0);
            readline.clearLine(process.stdout, 0);
            console.log(chalk.red('✗') + ` ${message}`);
        }
    };
}

function createProgressBar(total) {
    let current = 0;
    const barLength = 20;

    return {
        update: () => {
            current++;
            const progress = Math.min(current / total, 1);
            const filled = Math.round(barLength * progress);
            const empty = barLength - filled;

            readline.cursorTo(process.stdout, 0);
            process.stdout.write(
                `[${'#'.repeat(filled)}${'-'.repeat(empty)}] ${current}/${total}\n`
            );

            if (current >= total) {
                readline.cursorTo(process.stdout, 0);
                readline.clearLine(process.stdout, 0);
                console.log(chalk.green(`Completed ${current} of ${total} tasks`));
            }
        }
    };
}

async function queryOllama(prompt, retries = 3) {
    const spinner = createSpinner('Generating CV...');

    try {
        const messages = [
            {
                role: "system",
                content: "You are a professional CV customizer. Create a well-formatted CV in English. Focus on experience, skills and projects related to the job requirements. Use clear sections and professional language."
            },
            {
                role: "user",
                content: prompt
            }
        ];

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await axios.post(
                    process.env.OLLAMA_API_URL || 'http://localhost:11434/api/chat',
                    {
                        model: process.env.OLLAMA_MODEL || 'mistral',
                        messages,
                        stream: false,
                        options: {
                            temperature: 0.3,
                            num_ctx: 1024,
                            num_gpu: 0
                        }
                    },
                    {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: parseInt(process.env.OLLAMA_TIMEOUT || 180000)
                    }
                );

                if (!response.data?.message?.content) {
                    throw new Error('Invalid Ollama response');
                }

                spinner.stop('CV generated successfully');
                return response.data.message.content;
            } catch (err) {
                console.log(chalk.yellow(`Attempt ${attempt} failed: ${err.message}`));
                if (attempt === retries) throw err;
                await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
            }
        }
    } catch (err) {
        spinner.fail(`Failed to generate CV: ${err.message}`);
        throw err;
    }
}

async function getJoobleJobs(params) {
    const spinner = createSpinner('Fetching jobs from Jooble...');
    const apiKey = process.env.JOOBLE_API_KEY;
    if (!apiKey) {
        spinner.fail('JOOBLE_API_KEY is required in .env');
        throw new Error('JOOBLE_API_KEY is required in .env');
    }

    try {
        const response = await axios.post(`${JOOBLE_API_URL}/${apiKey}`, {
            keywords: `"${params.query}"`,
            location: params.location || '',
            radius: "40",
            page: "1",
            searchMode: "1",
            ResultOnPage: "10"
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });

        const jobs = response.data?.jobs || [];
        const seen = new Set();

        const filteredJobs = jobs.filter(job => {
            const key = (job.title || '') + '|' + (job.company || '');
            if (seen.has(key)) return false;
            seen.add(key);

            const q = params.query.toLowerCase();
            return job.title?.toLowerCase().includes(q) || job.snippet?.toLowerCase().includes(q);
        }).map(job => ({
            title: job.title,
            company: job.company,
            location: job.location,
            snippet: job.snippet,
            salary: job.salary,
            link: job.link
        }));

        spinner.stop(`Found ${filteredJobs.length} jobs`);
        return filteredJobs;
    } catch (err) {
        spinner.fail('Jooble API error: ' + err.message);
        throw new Error('Failed to fetch jobs from Jooble');
    }
}

// Build CV text from profile
function profileToCV(profile) {
    let cv = `PROFESSIONAL PROFILE\n`;
    cv += `Name: ${profile.name || 'Not specified'}\n`;
    cv += `Email: ${profile.email || 'Not specified'}\n`;
    cv += `Phone: ${profile.phone || 'Not specified'}\n\n`;
    
    cv += `SUMMARY\n`;
    cv += `${profile.summary || 'Experienced professional seeking new opportunities.'}\n\n`;

    if (profile.experiences?.length) {
        cv += `WORK EXPERIENCE\n`;
        profile.experiences.forEach(exp => {
            cv += `${exp.position || 'Position'} at ${exp.company || 'Company'}\n`;
            cv += `${exp.startDate || 'Start'} - ${exp.endDate || 'Present'}\n`;
            if (exp.description) cv += `${exp.description}\n`;
            cv += `\n`;
        });
    }

    if (profile.education?.length) {
        cv += `EDUCATION\n`;
        profile.education.forEach(edu => {
            cv += `${edu.degree || 'Degree'} in ${edu.field || 'Field'} at ${edu.school || 'School'}\n`;
            cv += `${edu.startDate || 'Start'} - ${edu.endDate || 'Graduated'}\n\n`;
        });
    }

    if (profile.skills?.length) {
        cv += `SKILLS & COMPETENCIES\n`;
        cv += `${profile.skills.join(', ')}\n\n`;
    }

    return cv;
}

async function generateCV(job, profile) {
    console.log(chalk.blue(`Processing: ${job.title} at ${job.company}`));

    const baseCV = profileToCV(profile);
    
    const prompt = `Create a professional CV tailored for this specific job opportunity. Use the candidate's profile information below and emphasize the skills and experiences most relevant to this position.

JOB OPPORTUNITY:
Position: ${job.title || 'Not specified'}
Company: ${job.company || 'Not specified'}
Location: ${job.location || 'Not specified'}
Requirements: ${job.snippet || 'No specific requirements provided'}

CANDIDATE PROFILE:
${baseCV}

IMPORTANT: Create a well-formatted CV in English. Focus on the most relevant experiences and skills for this specific job. Use clear section headers and professional language.`;

    const generatedCV = await queryOllama(prompt);

    // Ensure CV directory exists
    if (!fs.existsSync(CV_DIR)) {
        fs.mkdirSync(CV_DIR, { recursive: true });
    }

    const txtFilename = `cv_${sanitizeFilename(job.company || job.title)}_${Date.now()}.txt`;
    const pdfFilename = txtFilename.replace('.txt', '.pdf');

    // Save text version
    fs.writeFileSync(path.join(CV_DIR, txtFilename), generatedCV);
    
    // Generate PDF
    try {
        await generatePDF(generatedCV, path.join(CV_DIR, pdfFilename));
        console.log(chalk.green(`PDF generated: ${pdfFilename}`));
    } catch (err) {
        console.log(chalk.yellow(`PDF generation failed: ${err.message}, using text version only`));
        // If PDF generation fails, we'll still return the text version
    }

    return { 
        ...job, 
        cv: generatedCV, 
        cv_filename: pdfFilename, 
        cv_txt: txtFilename 
    };
}

// -------------------- Endpoints --------------------

// Templates endpoints (optional - for future use)
app.get('/templates', (req, res) => {
    try {
        const templates = {};
        const files = fs.readdirSync(CUSTOM_TEMPLATES_DIR);

        files.forEach(file => {
            if (file.endsWith('.txt')) {
                const name = file.replace('.txt', '');
                const content = fs.readFileSync(path.join(CUSTOM_TEMPLATES_DIR, file), 'utf-8');
                templates[name] = content;
            }
        });

        res.json({ success: true, templates });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/templates', (req, res) => {
    try {
        const { name, content } = req.body;
        if (!name || !content) {
            return res.status(400).json({ error: 'Name and content are required' });
        }

        const filename = `${sanitizeFilename(name)}.txt`;
        const filepath = path.join(CUSTOM_TEMPLATES_DIR, filename);
        fs.writeFileSync(filepath, content);

        res.json({ success: true, message: 'Template saved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/templates/:name', (req, res) => {
    try {
        const { name } = req.params;
        const filename = `${sanitizeFilename(name)}.txt`;
        const filepath = path.join(CUSTOM_TEMPLATES_DIR, filename);

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            res.json({ success: true, message: 'Template deleted' });
        } else {
            res.status(404).json({ error: 'Template not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Main search endpoint
app.post('/search', async (req, res) => {
    try {
        const { query, location, profile } = req.body;
        
        if (!query) {
            console.log(chalk.red('Query is required'));
            return res.status(400).json({ error: 'Query is required' });
        }
        
        if (!profile || !profile.name) {
            console.log(chalk.red('Profile information is required'));
            return res.status(400).json({ error: 'Please complete your profile first' });
        }

        console.log(chalk.cyan('\nStarting job search...'));
        const jobs = await getJoobleJobs({ query, location });

        if (jobs.length === 0) {
            console.log(chalk.yellow('No jobs found'));
            return res.json({ success: true, count: 0, results: [] });
        }

        console.log(chalk.cyan(`\nGenerating CVs for ${jobs.length} jobs...`));
        const progressBar = createProgressBar(jobs.length);
        const results = [];

        for (const job of jobs) {
            try {
                const result = await generateCV(job, profile);
                results.push(result);
            } catch (err) {
                console.log(chalk.yellow(`Skipping job due to error: ${err.message}`));
            }
            progressBar.update();
        }

        console.log(chalk.green('\nProcess completed successfully'));
        res.json({ success: true, count: results.length, results });
    } catch (err) {
        console.log(chalk.red('\nError during /search: ' + err.message));
        res.status(500).json({
            error: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// Serve CVs
app.use('/cvs', express.static(CV_DIR));

// Next.js handler
app.all('*', (req, res) => handle(req, res));

// Start Server
app.listen(PORT, () => {
    console.log(chalk.green(`Server running at http://localhost:${PORT}`));
});
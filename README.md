# CV Generator

A modern, AI-powered application that automates the job application process by generating tailored CVs for specific job opportunities. Users build a comprehensive professional profile once, and the application searches the Jooble job API based on their queries, retrieves relevant positions, and utilizes a local Ollama AI model to craft personalized, well-formatted CVs that highlight the most relevant skills and experiences for each role, finally presenting them as downloadable PDFs alongside the original job listings for a streamlined and efficient application workflow.

![App Screenshot](https://artur-bednarski.onrender.com/public/images/cv2.png)

![Next.js](https://img.shields.io/badge/Next.js-13%2B-black.svg?logo=next.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)

## Features

- 🤖 AI-powered CV generation using Ollama  
- 🔍 Job search integration with Jooble API  
- 📝 Professional profile builder with persistent storage  
- 📄 Automated PDF generation for tailored CVs  
- 🎨 Modern, responsive UI with dark theme  
- ⚡ Fast and efficient job application process  

## Tech Stack

- **Backend**: Node.js, Express.js  
- **Frontend**: React, Next.js  
- **AI**: Ollama (local LLM)  
- **Job API**: Jooble  
- **PDF Generation**: Custom PDF utility  
- **Styling**: Modern CSS with CSS variables  

## Installation

    # Clone the repository
    git clone https://github.com/your-username/cv-generator.git
    cd cv-generator

    # Install dependencies
    npm install

    # Set up environment variables
    cp .env.example .env

Edit the `.env` file with your configuration:

    JOOBLE_API_KEY=your_jooble_api_key_here
    OLLAMA_API_URL=http://localhost:11434/api/chat
    OLLAMA_MODEL=mistral
    PORT=3000
    NODE_ENV=development

Start the development server:

    npm run dev

## Usage

1. **Build Your Profile** → Click "Build Your Profile" to create your professional profile  
2. **Search for Jobs** → Enter a job title and location  
3. **Generate CVs** → The app will create tailored CVs for each job  
4. **Download CVs** → Download the generated PDF CVs  

## API Endpoints

| Method | Endpoint           | Description                      |
|--------|--------------------|----------------------------------|
| POST   | /search            | Search for jobs and generate CVs |
| GET    | /templates         | Get available CV templates       |
| POST   | /templates         | Save a new template              |
| DELETE | /templates/:name   | Delete a template                |
| GET    | /cvs/:filename     | Download generated CVs           |



## Requirements

- Node.js 18+  
- Ollama installed locally  
- Jooble API key  

## Contributing

1. Fork the project  
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)  
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)  
4. Push to the branch (`git push origin feature/AmazingFeature`)  
5. Open a Pull Request  



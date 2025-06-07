# ViroShort Deployment Script for Windows PowerShell
# Run this script to deploy your app to GitHub and Cloudflare

Write-Host "🎬 ViroShort - AI Video Generator Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git is not installed. Please install Git first:" -ForegroundColor Red
    Write-Host "   https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Get current directory
$currentDir = Get-Location
Write-Host "📁 Current directory: $currentDir" -ForegroundColor Green

# Initialize git repository if not already done
if (-not (Test-Path ".git")) {
    Write-Host "🔧 Initializing Git repository..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "✅ Git repository already initialized" -ForegroundColor Green
}

# Add all files
Write-Host "📦 Adding all files to Git..." -ForegroundColor Yellow
git add .

# Commit changes
$commitMessage = "🎬 ViroShort: AI Video Generator with Fish Audio voice synthesis"
Write-Host "💾 Committing changes: $commitMessage" -ForegroundColor Yellow
git commit -m $commitMessage

# Get GitHub username
$githubUsername = Read-Host "Enter your GitHub username"
if ([string]::IsNullOrWhiteSpace($githubUsername)) {
    Write-Host "❌ GitHub username is required!" -ForegroundColor Red
    exit 1
}

# Set repository name
$repoName = "viroshort-video-generator"
$githubUrl = "https://github.com/$githubUsername/$repoName.git"

# Check if remote already exists
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "✅ Remote origin already exists: $remoteExists" -ForegroundColor Green
} else {
    Write-Host "🔗 Adding GitHub remote: $githubUrl" -ForegroundColor Yellow
    git remote add origin $githubUrl
}

# Create main branch and push
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git branch -M main

try {
    git push -u origin main
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "🌐 Your repository: https://github.com/$githubUsername/$repoName" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Push failed. Please check:" -ForegroundColor Red
    Write-Host "   1. Repository exists on GitHub" -ForegroundColor Yellow
    Write-Host "   2. You have push permissions" -ForegroundColor Yellow
    Write-Host "   3. Your GitHub credentials are set up" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Create repository on GitHub: https://github.com/new" -ForegroundColor White
Write-Host "   - Repository name: $repoName" -ForegroundColor Gray
Write-Host "   - Make it Public" -ForegroundColor Gray
Write-Host "   - Don't initialize with README" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy to Cloudflare Pages:" -ForegroundColor White
Write-Host "   - Go to: https://dash.cloudflare.com" -ForegroundColor Gray
Write-Host "   - Click 'Pages' → 'Create a project'" -ForegroundColor Gray
Write-Host "   - Connect to Git → Select your repository" -ForegroundColor Gray
Write-Host "   - Framework: Astro" -ForegroundColor Gray
Write-Host "   - Build command: npm run build" -ForegroundColor Gray
Write-Host "   - Output directory: dist" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Add Environment Variables in Cloudflare:" -ForegroundColor White
Write-Host "   - OPENAI_API_KEY (for script generation)" -ForegroundColor Gray
Write-Host "   - REPLICATE_API_TOKEN (for image generation)" -ForegroundColor Gray
Write-Host "   - FISH_AUDIO_API_KEY (for voice synthesis)" -ForegroundColor Gray
Write-Host ""
Write-Host "🎬 Your app will be live at: https://$repoName.pages.dev" -ForegroundColor Green 
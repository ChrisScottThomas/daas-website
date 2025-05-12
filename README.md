# Clarity — Insight-as-a-Service Waitlist

A high-confidence, statically generated waitlist website for Clarity, a Strategic Insight-as-a-Service support plan for enterprise and product leaders. Built with Astro + Tailwind CSS, deployed via AWS (S3, CloudFront, API Gateway, Lambda, DynamoDB) using Terraform and GitHub Actions.

---

## 📁 Project Structure
```
.
├── astro-site/           # Static site built with Astro
│   ├── src/              # Pages, components, and styles
│   └── public/           # Static assets (robots.txt, favicon)
├── lambda/               # Lambda function to handle form submissions
├── terraform/            # Infrastructure as Code (AWS setup)
├── .github/workflows/    # GitHub Actions deploy pipeline
└── README.md
```

---

## 🚀 Live Components

### 🌐 Astro Frontend (`astro-site/`)
- Static landing page + thank-you page
- Tailwind CSS for styling
- Deployed to S3 and served via CloudFront

### 📬 Waitlist API (Lambda + API Gateway)
- Accepts form submissions (email only)
- Stores to DynamoDB
- Sends SES email confirmation

### ☁️ Terraform Infrastructure (`terraform/`)
- S3 buckets (frontend + state)
- CloudFront CDN
- API Gateway
- Lambda function
- DynamoDB for storage
- IAM roles and permissions

---

## 🧰 Dependencies

Install the following before use:
```bash
brew install nvm && nvm install 20
npm install -g terraform
npm install -g npm@9.6.7
```

Install project-specific dependencies:
```bash
cd astro-site
npm install
```

---

## 🛠 Running Locally

### Frontend
```bash
cd astro-site
npm run dev
```
Visit: `http://localhost:4321`

### Build for Production
```bash
npm run build
```
Generates `astro-site/dist/` for S3 upload.

---

## 🧪 Testing Lambda
Edit and test `lambda/index.js` manually or deploy to AWS using Terraform.

### Environment Variables
Ensure Lambda is configured with:
- `TABLE_NAME`
- `SENDER_EMAIL`

---

## 🔁 Deployment Pipeline
GitHub Actions handles full CI/CD:
- Builds Astro site
- Pulls API Gateway URL from Terraform outputs
- Injects it into landing page
- Syncs final `dist/` folder to S3

To trigger manually:
```bash
git push origin main
```

---

## ⚙️ Terraform Setup
```bash
cd terraform
terraform init
terraform apply
```
Outputs:
- API Gateway endpoint
- Bucket name
- CloudFront URL

---

## 📥 SES Setup (Amazon Console)
1. Verify your sender email address
2. Stay in sandbox or request production access

---

## 🧼 TODOs
- Add real domain
- Enable Plausible or GoatCounter analytics
- Add logo, real testimonials, and client logos
- Add pricing or plans page as needed

---

Built to be fast, lightweight, and credible for high-value B2B offerings.

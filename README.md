# Clarity. — Insight-as-a-Service

Clarity. is a strategic Insight-as-a-Service platform, offering leadership support plans for product and enterprise decision-makers.  
This repo powers the Clarity. website and waitlist, built for speed, clarity, and simplicity.

> 🌐 Live site: https://getclarity.win

---

## ⚙️ Stack Overview

| Area              | Technology                           |
|-------------------|---------------------------------------|
| Frontend          | Astro                                 |
| Styling           | Tailwind CSS                          |
| State             | Fully static, no JS frameworks used   |
| Hosting           | AWS S3 + CloudFront                   |
| Form backend      | AWS API Gateway + Lambda + DynamoDB   |
| Email             | AWS SES (with confirmation flow)      |
| Domain/DNS        | Route 53 + getclarity.win             |
| Infra Management  | Terraform                             |
| Deployment        | GitHub Actions                        |

---

## 📁 Project Structure
```
/
├── src/
│   ├── pages/               # All routable .astro pages
│   ├── layouts/             # Base layout template
│   ├── styles/              # Tailwind and global styles
│   ├── scripts/             # Theme + burger menu logic
├── public/                  # Static assets (logos, favicon, robots.txt)
├── terraform/               # IaC for S3, CloudFront, Lambda, SES etc.
├── .github/workflows/       # GitHub Actions CI/CD pipeline
├── package.json             # Site dependencies
└── README.md                # This file
```
---

## 🧠 Key Pages

| Route                  | Purpose                                |
|------------------------|----------------------------------------|
| /                      | Waitlist landing page                  |
| /thank-you             | Post-submission confirmation           |
| /how-we-can-help       | Overview of the service model          |
| /support-plans         | Pricing and engagement options         |
| /about                 | Mission, vision, and philosophy        |

---

## 🚀 Local Development

### 1. Install dependencies

npm install

### 2. Run the dev server

npm run dev

Visit http://localhost:4321

### 3. Build for production

npm run build

Output is generated in dist/.

---

## ☁️ Infrastructure (Terraform)

The terraform/ directory provisions:

- S3 bucket (static site hosting)
- CloudFront distribution (CDN + SSL)
- Route 53 DNS zone (getclarity.win)
- API Gateway + Lambda (waitlist handler)
- DynamoDB (waitlist email storage)
- SES (email confirmation)

### Getting Started

cd terraform
terraform init
terraform apply

> ACM certificates must be created in us-east-1 for CloudFront compatibility.  
> If you're not using Route 53 for your domain registrar, update NS records manually.

---

## 📬 SES Email Flow

1. Form submission triggers API Gateway → Lambda.
2. Lambda stores the email in DynamoDB.
3. Lambda sends confirmation email via SES.

### Required Lambda Environment Variables

- TABLE_NAME — DynamoDB table
- SENDER_EMAIL — Verified SES sender

---

## 🔐 Domain: getclarity.win

- DNS is managed via Route 53
- Domain registered externally (e.g. GoDaddy)
- NS records must be pointed to Route 53
- SSL issued via ACM for:
  - getclarity.win
  - www.getclarity.win

---

## 🌗 Features

- Fully responsive layout (mobile-first)
- Dark/light mode with persistent toggle
- Burger menu with accessible interactions
- Fixed logo + home icon navigation
- Feature-flag logic to enable/disable sections (e.g. Join button, testimonials)
- SVG-based brand logo adapting to theme
- Single layout system (base.astro) for consistency

---

## 🧪 Testing the Lambda Locally

1. Edit the lambda/index.js file
2. Manually invoke the handler or deploy via Terraform
3. Use test event payloads (email-only JSON)

---

## 🛠 Deployment (CI/CD)

All commits to main trigger a GitHub Actions workflow:

- Builds the Astro static site
- Injects the deployed API Gateway URL into the form
- Uploads to S3
- Invalidates CloudFront

Manually trigger a redeploy:

git push origin main

---

## 📈 Future Enhancements

- Analytics (e.g. Plausible, GoatCounter)
- Expanded pages (FAQs, ROI calculator, use cases)
- Add testimonials and client logos
- Add authentication for subscriber dashboard
- Multi-page form flow or plan selector
- Add 404 page and sitemap.xml

---

## 🧠 Inspiration & Philosophy

Clarity. was inspired by:

- Unreasonable Hospitality by Will Guidara
- $100M Offers by Alex Hormozi
- Real frustrations of product teams and digital leaders

It’s built to be practical, fast, and minimal —  
because decision-makers don’t have time for fluff.

---

## 👨‍💻 Maintainer

Made by Chris Scott-Thomas  
Crafted with Astro, AWS, and a lot of care.

---

## 🫶 License

MIT — free to use, fork, or learn from.

> Built for clarity.  
> Without the noise.

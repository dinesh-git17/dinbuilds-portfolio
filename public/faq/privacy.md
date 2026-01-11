# Privacy Policy

**Effective Date:** January 11, 2026

## Overview

This Privacy Policy describes how information is handled on the DinBuilds OS portfolio website. This is a personal portfolio project designed for demonstration and educational purposes, not a commercial service. The site simulates a desktop operating system environment to showcase engineering skills and project work.

## Information We Collect

### Automatically Collected Information
We use **Vercel Analytics** to understand how visitors interact with this website. This service is designed to be privacy-first and cookie-free. It collects anonymous usage data such as:
- Pages visited
- Interaction events (e.g., opening "apps," booting the OS, clicking links)
- Browser type and basic device information
- Approximate geographic location (country or region level)

This data is aggregated and does not identify individual users personally.

### Information You Provide
If you use the **Contact** application to send a message, we collect the information you explicitly provide in the form:
- Name
- Email address
- Message content

### Technical Data for Security
When you submit a contact form, we temporarily process your IP address. This is done strictly for security purposes to implement rate limiting, which prevents spam and abuse of the messaging feature.

## How Information Is Used

- **Analytics Data:** Used solely to analyze site performance, identify popular content, and understand user engagement trends.
- **Contact Information:** Used only to receive and respond to your inquiries. We do not use your email for marketing newsletters, nor do we sell or share it with third parties.
- **IP Addresses:** Used strictly to limit the number of requests a single user can make within a specific timeframe (currently set to a 1-hour window).

## Cookies and Local Storage

### Cookies
This website does **not** use cookies for tracking, analytics, or advertising.

### Local Storage
We use your browser's **Local Storage** to persist your interface preferences locally on your device. This allows the "OS" experience to remember your settings between visits.
- **Data Stored:** Wallpaper selection (`dinos-preferences` state) and dock configuration.
- **Purpose:** Purely for maintaining your UI customization choices.
- **Control:** This data stays on your device. You can delete it at any time by clearing your browser's site data.

## Third-Party Services

We rely on a small set of third-party infrastructure providers to operate this site:
- **Vercel:** Hosts the website, provides the analytics service, and manages the temporary storage (Redis) used for rate limiting.
- **Resend:** Processes and delivers the emails sent via the contact form.

## Data Retention

- **Contact Messages:** Information submitted via the contact form is delivered directly to the site owner's email inbox. It is not stored in a persistent database on the website server.
- **Rate Limiting Data:** IP address records stored for rate limiting purposes are automatically deleted (expired) after 1 hour.
- **Analytics Data:** Aggregated, anonymous data is retained by Vercel according to their standard retention policies.

## Security

We implement reasonable security measures to protect your information, including:
- **HTTPS:** All data transmitted between your browser and our servers is encrypted.
- **Input Validation:** Form data is validated to prevent malicious code injection.
- **Rate Limiting:** Controls are in place to prevent spam attacks.

Please be aware that while we strive to protect your data, no method of transmission over the internet is completely secure.

## Changes to This Policy

We may update this Privacy Policy to reflect changes in our codebase or legal requirements. Any changes will be posted on this page with an updated "Effective Date."

## Contact

If you have questions about this policy or the practices of this site, please contact: info@dineshd.dev
# Functionality List

_Last updated: 2026-10-30_

The team's functionality list for Sixth Sense. It is the reference for what each area must do; the mid-fi Figma screens show how it looks (see docs/IMPLEMENTATION_PLAN.md and docs/DECISIONS.md).

This list covers Account, Target Audience, Competitors, Content Creation, and AI Community Management (the mid-fi's AI Management). The other areas from the mid-fi have not been dropped: Dashboard, Insight Report, and Campaigns stay as planned in docs/IMPLEMENTATION_PLAN.md.

| Key Feature | Function | What it does |
|---|---|---|
| Account | Login | Email and password login pop-up window, with remember me option |
| Account | Forgot Password | Reset password link from pop-up window |
| Account | Create an account | Collect first and last name, role at company, email, phone number, and password (with confirmation) |
| Account | Form validation | Flag missing required fields and mismatched passwords; email is used for login |
| Account | Company information | Capture company name, address, city, province, country, and postal code |
| Account | General audience set up | Collect industry and sub-industry, target regions, audience types |
| Account | Set goals | Set goals and outcomes you would like the app to achieve for your campaigns |
| Account | Link social media | Link social and verify social media accounts sign-up |
| Account | Competitor setup (optional) | Add competitors by company name and website; add another |
| Account | Upload documents (optional) | Drag and drop past reports, ad results, or spreadsheets (PDF, PNG, JPG, DOCX, XLSX; max 3MB per file), or paste a link to a report |
| Account | Invite team (optional) | Invite teammates by email (multiple allowed) or generate an invite link; invite later |
| Account | Step navigation | Continue and Back buttons across the multi-step sign-up, with Add Later on optional steps |
| Target Audience | Trend search by category | Filter trends by demographics, age, and interests |
| Target Audience | Filter trends by demographics, age, and interests | Apply filters and choose how results are shown (charts, lists) |
| Target Audience | Default audience | Save a target audience as the default (pre-filled from onboarding) so searches and reports start from it |
| Target Audience | Suggest a target audience | AI suggests a target audience based on direct competitors' data and analytics |
| Competitors | Competitor tracking | Monitor posting frequency, engagement, best and worst performing posts, hashtags, and active ads |
| Competitors | Trend and campaign pattern detection | Highlight recurring themes in competitors' marketing campaigns |
| Competitors | Audience-based selection | Choose which competitors to track based on the selected target audience, starting with those added during sign-up |
| Content Creation | Create > Social post card | Display the page where you get AI content ideas and the needed guidelines for a social post including caption, hashtags, keywords, and allows you to set the target, platform, tone of voice and a blank space to explain your raw idea |
| Content Creation | Create > Video card | Display the page where the user can generate video concepts, scripts, storyboards, and creative guidelines based on their selected platform, video format, duration, and ideas |
| Content Creation | Create > Blog card | Display the page where the user can generate blog titles, article outlines, writing suggestions, and SEO keywords based on the user's topic and content goals |
| Content Creation | Create > Ad copy card | Display the page where the user can generate advertising headlines, ad copy, calls to action, and creative recommendations based on the product or service being promoted |
| Content Creation | Edit > Edit Posts card | Display the page where the user can select existing posts and modify their content with AI, including captions, visual recommendations, and alternative versions |
| Content Creation | Edit > Improve Copy card | Display the page where the user can paste existing text and improve its clarity, tone, engagement, and messaging with AI-generated suggestions |
| Content Creation | Edit > Repurpose Content card | Display the page where the user can transform existing content into different formats for multiple social media platforms, including adapted captions, hashtags, and visual recommendations |
| Content Creation | Edit > Upload Your File card | Display the page where the user can upload existing files and receive AI-powered suggestions to edit, improve, or repurpose their content |
| AI Community Management | Planning | Recommend post frequency, dates and times |
| AI Community Management | Calendar | Show all planned campaigns across all platforms in a unified calendar |
| AI Community Management | Auto-post function | Allow users to schedule content releases and post automatically |
| AI Community Management | Report Exports | Export analytics and reports in different formats. Allow users to select the format |
| AI Community Management | Schedule reports | Allow users to set report frequencies and export them automatically at the selected time |

## Status (2026-10-30)

| Function | Status |
|---|---|
| Login, Create an account, Form validation, Company information, Set goals, Competitor setup, Upload documents | Built (documents: file names only in the prototype) |
| Forgot Password | Built: the reset link is shown on screen (nothing can be emailed in the prototype) and expires after 15 minutes |
| General audience set up | Built; several general audiences can be chosen (Residential, Commercial, Industrial, Institutional) |
| Link social media | Built: Connect checks the handle and marks it verified; verification is simulated and labelled so |
| Invite team | Built: email invites, Generate a link (with Copy), and Invite later; the link shows who invited you on Create an Account |
| Step navigation | Built: Continue and Back, plus Add later and Add now on the optional parts of step 2 |
| Target Audience (all four) | Not built ("Explore Audience and Trend" is Coming soon) |
| Competitor tracking | Built on /competitors for the hospitality supplier, starting with sign-up competitors |
| Trend and campaign pattern detection | Built: recurring themes across tracked competitors |
| Audience-based selection | Built: the tracked choice is saved in the business profile |
| Content Creation (all eight cards) | Not built (planned as templates labelled "Suggestions"; Upload Your File will read TXT, MD, and CSV in the browser and ask for pasted text for other types) |
| Planning, Calendar | Not built |
| Auto-post function | Not planned for the prototype: content can be scheduled, but nothing posts automatically (DECISIONS.md 2026-10-30) |
| Report Exports | Partly: Print / Save as PDF exists; the format choice and CSV are planned |
| Schedule reports | Not built (planned to prepare due reports when the app is next opened, not while it is closed) |

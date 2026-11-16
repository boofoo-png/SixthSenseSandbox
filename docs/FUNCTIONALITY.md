# Functionality List

_Last updated: 2026-11-06_

The team's functionality list for Sixth Sense (updated 2026-11-05). It is the reference for what each area must do; the team's Figma Make "Marketing Intelligence Hub" shows how most screens look (see docs/IMPLEMENTATION_PLAN.md and docs/DECISIONS.md). Where this list and the Make disagree, the status below says so.

| Key Feature | Function | What it does |
|---|---|---|
| Account | Login | Email and password login pop-up window, with remember me option |
| Account | Forgot Password | Reset password link from pop-up window |
| Account | Create an account | Collect first and last name, role at company, email, phone number, and password (with confirmation) |
| Account | Form validation | Flag missing required fields and mismatched passwords; email is used for login |
| Account | Company information | Capture company name, address, city, province, country, and postal code |
| Account | General audience set up | Collect industry and sub-industry, target regions, audience types, using drop-down lists |
| Account | Set goals | Set goals and outcomes you would like the app to achieve for your campaigns |
| Account | Link social media | Link social and verify social media accounts sign-up |
| Account | Competitor setup (optional) | Add competitors by company name and website; add another button |
| Account | Upload documents (optional) | Drag and drop past reports, ad results, or spreadsheets (PDF, PNG, JPG, DOCX, XLSX; max 3MB per file), or paste a link to a report |
| Account | Invite team (optional) | Invite teammates by email (multiple allowed) or generate an invite link; invite later |
| Account | Step navigation | Continue and Back buttons across the multi-step sign-up, with Add Later on optional steps |
| Account | On boarding tutorial | First time user on-boarding tour that overlays information about key features and how to use them |
| Global Navigation (all pages) | Search bar (Ask anything) | Search the platform or ask the AI a question from any page |
| Global Navigation (all pages) | Sidebar menu | Move between Overview, Audience, Competitors, Content Creation, AI Management, and Reports; current page is highlighted |
| Global Navigation (all pages) | Notifications bell | Show alerts such as competitor activity, trend spikes, and metric drops |
| Global Navigation (all pages) | Company name menu | Access the account and company profile |
| Global Navigation (all pages) | Settings and help icons | Open account settings and help/support |
| Marketing Overview (Dashboard) | Navigation guide | Walk new users through the platform, quick overlay tour of the key features |
| Marketing Overview (Dashboard) | 7 / 30 day toggle | Switch every card between the last 7 and 30 days |
| Marketing Overview (Dashboard) | Competitor Activities | Show each competitor's latest change (%) and post count; shortcut to the Competitors page |
| Marketing Overview (Dashboard) | Market Interest | Gauge of audience interest (%) with an increase/decrease badge; links to the Audience page |
| Marketing Overview (Dashboard) | Audience Growth | Show new audience across linked channels with % change; links to the Audience page |
| Marketing Overview (Dashboard) | Engagement | Show engagement % and a bar chart of campaign trends (up or down) |
| Marketing Overview (Dashboard) | Planning | Show the next planned activity on the calendar; Ask More opens AI help |
| Marketing Overview (Dashboard) | Cross-Channel Momentum | Show performance change per linked channel (Instagram, Facebook, website, email); links to reports |
| Campaigns: Create Campaign | Draft / Published toggle | Switch between draft and published campaigns |
| Campaigns: Create Campaign | Guidance and examples | Placeholder examples and helper text on every field |
| Campaigns: Create Campaign | 1. Business goal | Choose Awareness, Lead, or Sales |
| Campaigns: Create Campaign | 2. Success target | Enter the target metric, target value, and why it matters |
| Campaigns: Create Campaign | 3. Focus / product / offer | Choose Product or Service; enter the offer summary and conversion CTA |
| Campaigns: Create Campaign | 4. Target audience and niche | Enter audience name, description, B2B/B2C/both, customer segment, location, decision-maker role, interests, and needs or struggles |
| Campaigns: Create Campaign | 5. Messaging | Enter the value proposition, key pain points, and core message |
| Campaigns: Create Campaign | 6. Channels and content formats | Select channels (LinkedIn, Email, Instagram) and describe content formats (e.g., product carousel, case study, founder video) |
| Campaigns: Create Campaign | 7. Timing and budget | Set the campaign window (slider), budget/resources, and launch date |
| Campaigns: Create Campaign | 8. Review before generation | Summary cards of objective, target, audience, channels, budget, and launch; add a one-sentence campaign summary |
| Campaigns: Create Campaign | Generate Campaign / Cancel | AI creates an editable draft: strategy, content and post ideas, channel schedule, and measurement plan. Nothing is published or spent |
| Campaigns: Create Campaign | Edit generated campaign | Edit strategy, content, channels, and budget before launching |
| Campaigns: Create Campaign | Review before publishing notice | Reminds the user the draft can be edited before launching ads or spending money |
| Insights and Weekly Reports | day/week toggle | Switch the report period |
| Insights and Weekly Reports | KPI cards | Total Spend, Revenue, ROAS, Impressions, Conversions, and Clicks, each with change vs. last week and an arrow to open details |
| Insights and Weekly Reports | AI Insights Summary | Revenue chart by day (Google vs. Meta) with a peak revenue tooltip, plus AI-written insights, top performer, underperformer, and a budget suggestion |
| Insights and Weekly Reports | Refresh and View Full Insight | Regenerate the AI summary; open the full insight |
| Insights and Weekly Reports | Weekly insights | What went well, comparison to last week, and a revenue summary |
| Insights and Weekly Reports | Performance by Country | Map of top countries with metric and country filters, top performing revenue, revenue growth, and period; covers Hotel Depot and Hospitality Emporium |
| Insights and Weekly Reports | Top Campaigns | Bar chart and table of spend, revenue, conversions, and ROAS, plus a performance score and weekly earnings vs. last week |
| Insights and Weekly Reports | Export Report | Option for user to export the report as a spreadsheet or pdf |
| Competitors: Competitor Performance | Filter by findings | Filter by most viewed post, most liked post, most popular item, most popular trends, common reused layouts, and most used by users |
| Competitors: Competitor Performance | Competitor campaign cards | Cards with brand, date, title, description, and tags (e.g., Paid social, Organic) to explore a competitor's campaign |
| Competitors: Competitor Performance | Competitor comparison | Compare your content to competitors' (e.g., Reels count and average engagement), the engagement gap, and the period |
| Competitors: Competitor Performance | Evidence note | Explains the calculation (engagements ÷ reach × 100, unweighted averages) and that results are a test opportunity, not a guarantee |
| Competitors: Competitor Performance | Your next move | AI turns the benchmark into three steps: spot the opportunity, when to post, and review after 7 days against a target |
| Content Creation: Hub | Create new AI-guided content | Cards to start a Social Post, Video, Blog, or Ad Copy |
| Content Creation: Hub | Edit and enhance existing content | Cards to start Edit Posts, Improve Copy, Repurpose Content, or Upload Your File |
| Content Creation: Hub | My Content button | Open the content library from any content page |
| Content Creation: Social Post | Upload your post | Optionally upload an existing post to work from |
| Content Creation: Social Post | Content goal / Tone of voice / Idea | Choose a goal (awareness, engagement, sales) and tone (professional, casual, friendly), then describe the idea |
| Content Creation: Social Post | Generate with AI | Create AI content suggestions from the inputs |
| Content Creation: Social Post | AI Content Suggestions | Show a caption, visual guidelines, and suggested hashtags (optional) |
| Content Creation: Social Post | Regenerate / Save | Generate new options, or save the idea so it can be edited or added to the calendar |
| Content Creation: Video | Video details | Choose platform, goal, format (short-form, tutorial, product demo), and duration, then describe the idea |
| Content Creation: Video | Generate with AI | Create video suggestions from the inputs |
| Content Creation: Video | AI Video Suggestions | Show a video script, a video concept, and a storyboard with scene breakdown and timing (hook, main content, call to action) |
| Content Creation: Video | Regenerate / Save | Generate new options, or save the video idea |
| Content Creation: Blog | AI Blog Suggestions | Show suggested titles, an article outline, key points and content guidance, and SEO keywords |
| Content Creation: Blog | Regenerate / Save | Generate new options, or save the blog idea |
| Content Creation: Ad Copy | Ad details | Enter the product or service, campaign goal, and ad format (image ad, video ad, carousel, story) |
| Content Creation: Ad Copy | Generate with AI | Create ad copy suggestions from the inputs |
| Content Creation: Ad Copy | Ad headlines and ad copy | Show several headline and copy options, each with a copy-to-clipboard button |
| Content Creation: Ad Copy | Call to action (CTA) | Recommend CTA options (Learn More, Book Now, Shop Now, Get Started, Sign Up, Discover More) |
| Content Creation: Ad Copy | Creative guidelines | Show visual and messaging recommendations for the ad |
| Content Creation: Ad Copy | Regenerate / Save Content | Generate new options, or save the ad copy |
| Content Creation: Edit Posts | Post to edit | Upload an existing post, describe what to change, and add specific instructions (optional) |
| Content Creation: Edit Posts | Enhance with AI | Create improved versions of the post |
| Content Creation: Edit Posts | AI Enhanced Suggestions | Show a revised caption, three alternative options, visual suggestions (optional), and suggested hashtags (optional) |
| Content Creation: Edit Posts | Regenerate / Save Changes | Generate new options, or save the edited post |
| Content Creation: Improve Copy | Text to improve | Choose the content type (caption, ad copy, email), paste the text, say what to improve, and add instructions (optional) |
| Content Creation: Improve Copy | Improve with AI | Create improved versions of the text |
| Content Creation: Improve Copy | AI Improved Suggestions | Show an improved version, three alternative options, and a list of key improvements, with copy buttons |
| Content Creation: Improve Copy | Regenerate / Save Changes | Generate new options, or save the improved copy |
| Content Creation: Repurpose Content | Source content | Pick saved content or paste a blog, post, or video transcript |
| Content Creation: Repurpose Content | Repurpose for | Select target platforms (Instagram, Facebook, TikTok, Blog) and add instructions (optional) |
| Content Creation: Repurpose Content | Enhance with AI | Transform the content for each selected platform |
| Content Creation: Repurpose Content | AI Repurposed Content | Platform tabs, each showing the adapted content, suggested hashtags (optional), and key adjustments |
| Content Creation: Repurpose Content | Regenerate / Save Version | Generate new options, or save the version |
| Content Creation: Upload Your File | File details | Upload an existing file and choose a focus (Edit, Repurpose, Copy, Insights); add instructions (optional) |
| Content Creation: Upload Your File | Analyze with AI | Review the file and suggest how to improve it |
| Content Creation: Upload Your File | AI Suggestions | Show a file preview, summary, suggested actions, and key takeaways |
| Content Creation: Upload Your File | Regenerate / Save Content | Generate new suggestions, or save the content |
| Content Creation: My Content | Upload content | Add images, videos, or other files to the library |
| Content Creation: My Content | Search and sort | Search content and sort (e.g., newest first) |
| Content Creation: My Content | Grid / List view | Switch how the library is displayed |
| Content Creation: My Content | Type filters | Filter by All, Images, Videos, Social posts, Blog posts, or Ad copy, with item counts |
| Content Creation: My Content | Content cards | Show each item with type, name, and format; menu to open, edit, or reuse it |
| AI Content Manager: AI Posting Plan | Recommended frequency | AI recommends posts per week based on audience activity |
| AI Content Manager: AI Posting Plan | Best days to post | Highlight the days with the highest engagement rate |
| AI Content Manager: AI Posting Plan | Best time to post | Show peak time windows from audience online activity, in the chosen time zone (PST) |
| AI Content Manager: AI Posting Plan | Recommended content mix | Show the suggested split of educational, inspirational, promotional, and behind-the-scenes content |
| AI Content Manager: AI Posting Plan | Generate New Plan | Start the 3-step plan creator |
| AI Content Manager: AI Posting Plan | Content Calendar | Monthly view of all scheduled posts with channel icon, time, and title; navigate months; filter by channel or add a channel |
| AI Content Manager: AI Posting Plan | Upcoming Posts | List the next scheduled posts with channel, date, and time, and a menu for each; View All |
| AI Content Manager: AI Posting Plan | Auto Publishing | Toggle automatic publishing of scheduled posts to connected accounts; shows account status and Manage Accounts |
| AI Content Manager: AI Posting Plan | Per-platform adjustments | Adjust post type (single, carousel, video) and captions per platform, with suggested formats (carousel for Instagram, video for TikTok) |
| AI Content Manager: AI Posting Plan | Business schedules | Keep separate schedules for Hotel Depot and Hospitality Emporium |
| AI Content Manager: Generate a Plan (Step 1, Plan Settings) | Content to include | Choose a content type (image, video, carousel, text only, link), upload media (JPG, PNG, WEBP, MP4, MOV) or open the media library, and write a caption or content brief |
| AI Content Manager: Generate a Plan (Step 1, Plan Settings) | Plan settings | Set the date range and primary goal (e.g., increase engagement) |
| AI Content Manager: Generate a Plan (Step 1, Plan Settings) | Connected channels | Select which connected accounts to publish to |
| AI Content Manager: Generate a Plan (Step 1, Plan Settings) | Publishing schedule | Set posting frequency, time zone, preferred posting days (e.g., before a sale), and best time windows from audience activity |
| AI Content Manager: Generate a Plan (Step 1, Plan Settings) | Content direction | Describe what the plan should focus on; Use audience insights to optimize timing |
| AI Content Manager: Generate a Plan (Step 1, Plan Settings) | Plan preview | Show estimated posts, connected channels, posts per week, days, and the recommended content mix |
| AI Content Manager: Generate a Plan (Step 1, Plan Settings) | Generate plan / Cancel | Create AI suggestions; the existing calendar does not change until the plan is approved |
| AI Content Manager: Generate a Plan (Step 2, Review Suggestions) | Summary tiles | Show draft suggestions, connected channels, date range, and number selected |
| AI Content Manager: Generate a Plan (Step 2, Review Suggestions) | Suggested posts table | Select posts with checkboxes; each row shows date/time, channel, content, and format, with a menu; filter by format |
| AI Content Manager: Generate a Plan (Step 2, Review Suggestions) | Regenerate all | Generate a new set of drafts |
| AI Content Manager: Generate a Plan (Step 2, Review Suggestions) | Post preview | Show the AI draft with image, caption, hashtags, and date/time; Edit post and Regenerate for the selected draft |
| AI Content Manager: Generate a Plan (Step 2, Review Suggestions) | Ready when you are | Confirm drafts selected and channels connected; nothing is scheduled yet |
| AI Content Manager: Generate a Plan (Step 2, Review Suggestions) | Back to settings / Add posts to calendar | Return to edit settings, or add the selected drafts to the calendar |
| AI Content Manager: Generate a Plan (Step 3, Add to Calendar) | Confirmation banner | Show how many posts were added, across how many channels, and that Auto Publishing is on |
| AI Content Manager: Generate a Plan (Step 3, Add to Calendar) | Content Calendar | Show the newly scheduled posts highlighted; filter by channel; add a new post |
| AI Content Manager: Generate a Plan (Step 3, Add to Calendar) | Scheduled posts | List approved posts with thumbnail, channel, format, and date/time; counts of scheduled and published |
| AI Content Manager: Generate a Plan (Step 3, Add to Calendar) | Create another plan / Go to Content Calendar | Start a new plan, or open the full calendar |

## Status (2026-11-06)

Compared with the app on `feat/sixth-sense` (after commit 03e497b, with the work since), which follows the Figma Make as it was on 2026-11-05. The demo account owns two sample businesses, Hotel Depot and Hospitality Emporium; the company name menu in the top bar switches between them, and every page shows the chosen one.

| Area | Status |
|---|---|
| Account (all but drop-downs) | Built, as before. Forgot Password shows the reset link on screen; social linking and document uploads are simulated and labelled so |
| Account: General audience set up | Partly: industry, region, and audience are chosen with chips, not drop-down lists (the team's Dropdown component is still being built) |
| Account: On boarding tutorial | Built: welcome and seven-step tour after sign-up |
| Global Navigation | Built: Ask anything, sidebar, company name menu (switch business, and Profile and settings), Settings, and Help (opens Sense AI). Differences: the sidebar also lists Campaigns (user's choice), the notifications bell only says there are none yet, and Ask anything still only repeats the question |
| Marketing Overview | Built: tour, 7 / 30 day toggle, and all six cards. Market Interest links to Audience; Planning shows the next post on the chosen business's AI Management calendar with Open calendar and Ask More (opens Sense AI) |
| Campaigns: Create Campaign | Built: all eight parts, Draft / Published, Generate / Cancel, the editable draft, and the review notice. The draft has no measurement plan yet |
| Insights and Weekly Reports | Built on Reports from the design file, on sample Google and Meta ad data (labelled as sample): day/week (7 / 30 day) toggle, all six KPI cards with details, AI Insights Summary with Refresh and View Full Insight (weekly insights), Top Campaigns, and Export Report (PDF or spreadsheet). Performance by Country is a ranked list with flags instead of a map (user's choice). Follows the business chosen in the top bar (Hotel Depot or Hospitality Emporium) |
| Competitors: Competitor Performance | Not adding (user's decision, 2026-11-05): the page stays as built from the Figma Make; the list's findings filter, campaign cards, comparison with your content, evidence note, and Your next move are left out |
| Content Creation: Hub and the eight tools | Built, with the list's wording: Enhance with AI on Edit Posts, Upload focus Edit / Repurpose / Copy / Insights, and Ad Copy calls to action from the list's six (three recommended per goal). Save keeps a result in the browser, and Add to calendar opens the calendar's post editor filled in from it, then puts the post on the chosen business's AI Management calendar |
| Content Creation: My Content | Not built: no library page yet (saved items live in the browser and appear in Repurpose) |
| AI Content Manager (posting plan, calendar, 3-step plan creator) | Built on AI Management (/ai-management and /ai-management/plan) from the team's design file: recommendations, content calendar, upcoming posts, per-platform post types, and the three-step plan generator. Auto Publishing is a simulated switch: nothing is posted and posts stay Scheduled (user's choice, 2026-11-05) |
| Target Audience | Built on Audience Trends (/explore) from the team's Figma Make (2026-11-16): saved audiences, depth and source filters, trend radar, watchlist, ranked trends, and campaign direction. This list no longer describes the page beyond the sidebar link |
| Business schedules (Hotel Depot and Hospitality Emporium) | Built: chosen from the company name menu in the top bar (for the demo account), with a separate schedule for each saved in the browser |

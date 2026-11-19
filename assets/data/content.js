/* Contenido del sitio — editar aquí, no en el HTML ni en el JS.
   Todo lo que muestran las apps de estebanOS sale de window.DATA.
   Los pendientes de Esteban están marcados con TODO(esteban). */
window.DATA = {
  "papers": {
    "01": {
      "num": "No. 01 · 2026",
      "status": "UNDER EDITORIAL REVIEW",
      "statusClass": "review",
      "title": "Point Forecasts, Density Signals, and the Limits of Parsimony",
      "subtitle": "Inflation Prediction Across Regimes in Colombia",
      "venue": "Submitted to Emerging Markets Review · with collaborators",
      // TODO(esteban): ¿es el mismo paper de SSRN 6968222? Si sí, agrega
      // "link": "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6968222", "linkLabel": "READ ON SSRN ↗"
      "abstract": "This paper benchmarks a battery of inflation-forecasting models for Colombia — from parsimonious univariate specifications (Random Walk, AR, ARX) to Bayesian structural models (BVAR with Minnesota prior, TVP-BVAR-SV following Primiceri 2005) — across distinct monetary policy regimes. We document that density forecast calibration, rather than point accuracy, reveals where parsimony breaks down and where time-varying parameter structures earn their complexity. Evidence suggests that regime-aware model selection dominates fixed ex-ante specifications for emerging-market inflation, with implications for central bank nowcasting.",
      "tags": "BAYESIAN · DENSITY FORECAST · TVP-BVAR-SV · COLOMBIA"
    },
    "02": {
      "num": "No. 02 · 2026",
      "status": "WORKING PAPER · SSRN",
      "statusClass": "progress",
      "title": "A Hybrid Early-Warning System for Inflation in an Emerging Market",
      "subtitle": "Combining Econometric Models, an Agent-Based Decomposition with Heterogeneous Expectations, a Large Language Model, and a Multi-Output Agent Architecture",
      "venue": "Working paper · SSRN · in preparation for Economic Modelling",
      "abstract": "We propose a hybrid early-warning framework that fuses classical econometric forecasting with an agent-based decomposition of inflation expectations under heterogeneity, augmented by a Large Language Model for real-time narrative signal extraction and orchestrated through a multi-output agent architecture. Applied to Colombian CPI, the system outperforms benchmark econometric models in regime-change detection and short-horizon density calibration, while surfacing interpretable policy signals for monetary authorities.",
      "tags": "LLM · AGENT-BASED · MULTI-AGENT · INFLATION · EARLY WARNING",
      "link": "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6625578",
      "linkLabel": "READ ON SSRN ↗"
    },
    "03": {
      "num": "No. 03 · 2026",
      "status": "IN PROGRESS",
      "statusClass": "progress",
      "title": "Structural Dynamics and Risk Transmission in the Colombian Banking System",
      "subtitle": "Working title",
      "venue": "Working paper",
      "abstract": "An ongoing investigation into capital adequacy, regulatory compliance, and counterparty credit risk frameworks in Colombian banking under SFC standards, with emphasis on SA-CCR exposure dynamics and systemic transmission channels. Full abstract forthcoming.",
      "tags": "BANKING · SA-CCR · REGULATORY · SYSTEMIC RISK"
    },
    "04": {
      "num": "No. 04 · 2026",
      "status": "IN PROGRESS",
      "statusClass": "progress",
      "title": "Large Language Models in Macroeconomic Forecasting: Architectures and Empirical Evidence",
      "subtitle": "Working title",
      "venue": "Working paper",
      "abstract": "Exploring the frontier between classical econometric forecasting and modern AI architectures for macroeconomic prediction. Evaluates multi-agent systems, fine-tuned LLMs, and hybrid econometric-AI pipelines against traditional benchmarks. Full abstract forthcoming.",
      "tags": "LLM · MACHINE LEARNING · FORECASTING · AI"
    },
    "05": {
      "num": "No. 05 · 2023",
      "status": "PUBLISHED",
      "statusClass": "published",
      "title": "Effects of Coca Crops on Academic Performance in Colombia (2018–2021)",
      "subtitle": "",
      "venue": "Sekia Research Group · Pontificia Universidad Javeriana · November 2023",
      "abstract": "Municipal-level analysis using SABER 11 standardized test scores to quantify the causal effect of coca cultivation on educational outcomes. A one standard deviation increase in cultivated hectares reduces average scores by approximately 0.03 standard deviations. Winner of the FENADECO Research Seedbeds Call and Javeriana's Economics Research Competition.",
      "tags": "EDUCATION · DEVELOPMENT · CAUSAL INFERENCE · COLOMBIA"
    },
    "06": {
      "num": "No. 06 · 2023",
      "status": "WORKING PAPER",
      "statusClass": "working",
      "title": "Media Bias in Coverage of Social Protests in Colombia",
      "subtitle": "",
      "venue": "CINEP · Sekia Research Group · October 2023",
      "abstract": "Collaboration with CINEP to assess potential biases in Colombian news coverage of social protests. Constructed the research database and conducted exploratory analysis of reporting trends across major Colombian media outlets.",
      "tags": "MEDIA · NLP · POLITICAL ECONOMY"
    },
    "07": {
      "num": "No. 07 · 2023",
      "status": "WORKING PAPER",
      "statusClass": "working",
      "title": "Born This Way",
      "subtitle": "",
      "venue": "Sekia Research Group · Interdisciplinary · March 2023",
      "abstract": "Interdisciplinary working paper developed with medical students. Contributed to statistical design, data analysis, and interpretation of results in a study relevant to health demographics and social policy in Colombia.",
      "tags": "HEALTH · DEMOGRAPHICS · INTERDISCIPLINARY"
    },
    "08": {
      "num": "No. 08 · 2026",
      "status": "WORKING PAPER · GOING TO SSRN",
      "statusClass": "prep",
      "title": "Spatial Inequality in Educational Performance Across Bogotá",
      "subtitle": "A Spatial Durbin Approach Using ICFES Saber 11 Microdata",
      "venue": "Working paper · forthcoming on SSRN · journal submission planned",
      "abstract": "We document the spatial structure of educational outcomes in Bogotá using ICFES Saber 11 microdata aggregated across four spatial scales (sede, ZAT, UPZ, UPL) and multiple contiguity-based weight matrices. Global and local Moran's I statistics confirm strong, scale-dependent spatial dependence in standardized test scores, with persistent hot spots in the north (Usaquén, Chapinero, Suba, Teusaquillo) and cold spots in the south (Ciudad Bolívar, Bosa, Usme, San Cristóbal). A pooled Spatial Durbin Model identifies eight institutional and household covariates whose indirect (spillover) effects are statistically significant beyond their direct contribution, suggesting that policy interventions cannot be evaluated in isolation from neighborhood spatial structure.",
      "tags": "SPATIAL ECONOMETRICS · SDM · EDUCATION · COLOMBIA · INEQUALITY"
    }
  },
  "paperStatus": {
    "01": "UNDER EDITORIAL REVIEW",
    "02": "WORKING PAPER · SSRN",
    "03": "IN PROGRESS",
    "04": "IN PROGRESS",
    "05": "PUBLISHED",
    "06": "WORKING PAPER",
    "07": "WORKING PAPER",
    "08": "WORKING PAPER · GOING TO SSRN"
  },
  "pillars": [
    {
      "l": "A.",
      "n": "Research",
      "b": "Bayesian econometrics, inflation forecasting, emerging-market time series. One paper under editorial review at <em>Emerging Markets Review</em>, a second on SSRN in preparation for <em>Economic Modelling</em>.",
      "t": "PAPERS · ECONOMETRICS · MONETARY POLICY"
    },
    {
      "l": "B.",
      "n": "Strategy & Markets",
      "b": "M&amp;A and corporate-project evaluation, valuation and Board materials at Grupo Aval. Before that, capital markets and regulatory risk for tier-1 banks: an SA-CCR exposure engine and a Calypso implementation front to back.",
      "t": "M&A · VALUATION · SA-CCR · CALYPSO"
    },
    {
      "l": "C.",
      "n": "Public Writing",
      "b": "Commentary on Colombian economics — labor markets, inflation, income structure. Published on X, with growing readership.",
      "t": "COLUMNS · POLICY · COLOMBIA"
    },
    {
      "l": "D.",
      "n": "Building",
      "b": "Python, R, VBA, LaTeX. Pipelines, valuation engines, automations. I ship what I research.",
      "t": "PYTHON · R · SYSTEMS · AUTOMATION"
    }
  ],
  "methodIntro": "M y work lives at the intersection of four disciplines. I don't choose between them — I move through all four daily. A regulatory model in the morning, an econometric paper in the afternoon, a public column at night. This is the method.",
  "projects": [
    {
      "no": "№ 01",
      "t": "SA-CCR Exposure &amp; Valuation Engine",
      "tags": "PYTHON · DERIVATIVES · REGULATORY RISK · SFC · STRESS TESTING",
      "b": "A fully functional SA-CCR counterparty credit risk exposure calculator for FX and Rates derivatives portfolios. Aligned with SFC regulation. Used for regulatory capital measurement, stress testing, and risk reporting at a tier-1 Colombian financial institution."
    },
    {
      "no": "№ 02",
      "t": "Calypso Treasury System Implementation",
      "tags": "CALYPSO · NASDAQ · CAPITAL MARKETS · FRONT-TO-BACK",
      "b": "End-to-end implementation of the Calypso treasury system across front, middle, and back office functions. Configured pricing tools, trade workflows, market data integrations, and accounting rules for a major state-owned Colombian bank."
    },
    {
      "no": "№ 03",
      "t": "Inflation Forecasting System — Colombia",
      "tags": "R · PYTHON · BVAR · TVP-BVAR-SV · RESEARCH INFRASTRUCTURE",
      "b": "Production-grade pipeline for benchmarking time-series inflation forecasting models. Combines ARIMA, Bayesian VARs, and time-varying parameter models with rolling-window backtests and Diebold–Mariano tests. Infrastructure backing working papers 01–02."
    },
    {
      "no": "№ 04",
      "t": "Multi-Agent Early-Warning System",
      "tags": "LLM · MULTI-AGENT · HETEROGENEOUS EXPECTATIONS · EXPERIMENTAL",
      "b": "Experimental architecture combining agent-based inflation decomposition, LLM-driven narrative extraction, and multi-output orchestration. Research prototype for paper 02."
    },
    {
      "no": "№ 05",
      "t": "Investment Performance Dashboards &amp; Automation",
      "tags": "PYTHON · POWER BI · JP MORGAN · WORKFLOW AUTOMATION",
      "b": "Internal dashboards and automated workflows for monitoring investment performance metrics and reducing manual reporting effort at JP Morgan Chase, spanning finance and workforce analytics."
    },
    {
      "no": "№ 06",
      "t": "Media Bias Dataset &amp; Analysis",
      "tags": "R · PYTHON · NLP · CINEP COLLABORATION",
      "b": "Structured and analyzed datasets to assess bias patterns in Colombian news coverage of social protests. Exploratory NLP analysis across major outlets in collaboration with CINEP."
    },
    {
      "no": "№ 07",
      "t": "pulso — GEIH Microdata Loader",
      "tags": "PYTHON · OPEN SOURCE · DANE · LABOR ECONOMICS · DATA INFRASTRUCTURE",
      "b": "Open-source Python library for single-line access to Colombia’s <em>Gran Encuesta Integrada de Hogares</em> (GEIH) — DANE’s monthly household survey covering 2006 to the present. Handles download, parsing, and cross-epoch harmonization across the 2022 methodological redesign, including the GEIH Empalme series. Built under a multi-agent architect/builder/curator workflow. Stable on PyPI: <code>pip install pulso-co</code> · <a class=\"project__link\" href=\"https://pypi.org/project/pulso-co/\" rel=\"noopener\" target=\"_blank\">PyPI ↗</a> · <a class=\"project__link\" href=\"https://github.com/Stebandido77/pulso\" rel=\"noopener\" target=\"_blank\">github.com/Stebandido77/pulso ↗</a>"
    },
    {
      "no": "№ 08",
      "t": "Patrion — Personal Wealth Management App",
      "tags": "PRODUCT · PERSONAL FINANCE · WEALTH · IN DEVELOPMENT",
      "b": "Personal wealth management app currently in development. Aims to give retail investors and high-net-worth households a structured view of their assets, liabilities, cash flows, and risk exposures — bridging the gap between consumer expense trackers and institutional portfolio analytics. Built as a side project applying valuation, risk, and product design principles from the day job. Codename: <em>Patrion</em>."
    },
    {
      "no": "№ 09",
      "t": "Aval Banking Intelligence (ABI)",
      "tags": "PYTHON · LAKEHOUSE · SFC DATA · BANKING INTELLIGENCE",
      "b": "Analysis and commercial-tracking system for the Colombian banking industry at Grupo Aval. A Python lakehouse that joins regulatory, market and competitive data and feeds strategy, Board and investor work."
    },
    {
      "no": "№ 10",
      "t": "andina — TES Yield-Curve Analytics",
      "tags": "PYTHON · FIXED INCOME · TES · NELSON–SIEGEL–SVENSSON",
      "b": "Colombian sovereign yield-curve toolkit: Nelson–Siegel–Svensson fitting on TES, with full bond analytics (pricing, duration, convexity, carry)."
    },
    {
      "no": "№ 11",
      "t": "Ceteris Paribus <span class=\"project__live\">Live</span>",
      "tags": "EDUCATION · MICROECONOMICS · INTERACTIVE · LIVE PLATFORM",
      "b": "An interactive platform to learn microeconomics, econometrics and macro, built on Varian and Wooldridge. Its market game simulates many agents setting prices that converge to equilibrium, with supply and demand shocks, taxes and price controls. <a class=\"project__link\" href=\"https://ceteris-paribus-pearl.vercel.app/\" rel=\"noopener\" target=\"_blank\">Open the platform ↗</a>"
    },
    {
      "no": "№ 12",
      "t": "active-equity-desk",
      "tags": "PYTHON · EQUITY · MULTI-AGENT RESEARCH · IN DEVELOPMENT",
      "b": "Active portfolio-management system for the Bolsa Millonaria competition (bvc × trii): a COP 100M equity-only book, with an agent-based research workflow inspired by TradingAgents. Designed to keep growing into a real investment system."
    },
    {
      "no": "№ 13",
      "t": "PGN — Colombia's Budget, Line by Line",
      "tags": "PUBLIC FINANCE · DATA VISUALIZATION · PUBLIC WRITING",
      "b": "Where the Presupuesto General de la Nación goes, and how this year's bill compares with last year's. Charts built to explain the budget in public."
    },
    {
      "no": "№ 14",
      "t": "WHOOP Lab",
      "tags": "OPEN SOURCE · DASHBOARD · PERSONAL DATA",
      "b": "An open-source local dashboard to analyze the official WHOOP data export, including localized (Spanish) headers. Runs in the browser; nothing is uploaded. <a class=\"project__link\" href=\"https://github.com/Stebandido77/whoop-lab\" rel=\"noopener\" target=\"_blank\">github.com/Stebandido77/whoop-lab ↗</a>"
    }
  ],
  "traj": [
    {
      "d": "2026 — PRESENT",
      "r": "Analyst · Strategic Planning &amp; Investor Relations",
      "o": "Grupo Aval · Bogotá, Colombia",
      "b": "Drive strategic planning, corporate development, and competitive intelligence for Grupo Aval’s banking holding — financial performance review across subsidiaries, M&amp;A and corporate-project evaluation, and scenario design for medium- and long-term projections. Lead market and competitive-positioning analysis across business lines, products, and segments in the Colombian financial sector, and prepare strategic materials for the Board, institutional investors, and shareholders. Build the Aval Banking Intelligence (ABI) pipeline — a Python lakehouse integrating regulatory, market, and competitive data — as the analytical backbone of the function."
    },
    {
      "d": "SEP 2025 — 2026",
      "r": "Consultant II",
      "o": "Management Solutions · Bogotá, Colombia",
      "b": "Lead client-facing workstreams with C-level executives at tier-1 financial institutions across capital markets strategy, asset management advisory, and regulatory alignment. Built a fully functional SA-CCR exposure engine for FX and Rates derivatives aligned with SFC standards, and participated end-to-end in the Calypso (Nasdaq) implementation across front, middle, and back office."
    },
    {
      "d": "JAN 2025 — SEP 2025",
      "r": "Consultant",
      "o": "Management Solutions · Bogotá, Colombia",
      "b": "Delivered strategic engagements for top-tier Colombian banks focused on investment product design, capital markets analysis, and financial optimization. Performed valuation of fixed income, equity, and derivatives instruments and led front-to-back efficiency assessments for capital markets desks."
    },
    {
      "d": "JUN 2024 — JAN 2025",
      "r": "ED&amp;SE Intern",
      "o": "JP Morgan Chase",
      "b": "Built data pipelines and dashboards to support internal investment processes and performance monitoring. Developed automated tools to track investment metrics and applied data analytics to surface insights across finance and workforce domains."
    },
    {
      "d": "AUG 2023 — DEC 2025",
      "r": "Research Group Leader",
      "o": "Sekia Research Group · Pontificia Universidad Javeriana",
      "b": "Coordinated applied research across econometrics, data analysis, academic writing, and presentation tracks. Led project management for academic publications and external research collaborations with institutions such as CINEP."
    }
  ],
  "formation": [
    {
      "d": "M.Sc. Applied Economics",
      "o": "Universidad de los Andes · Bogotá",
      "m": "2026 – 2027 · <em>In progress</em>"
    },
    {
      "d": "M.Sc. Finance &amp; Financial Management",
      "o": "Escuela Europea de Negocios · Spain",
      "m": "2024 – 2025" // TODO(esteban): confirmar fechas de EUDE
    },
    {
      "d": "B.S. Industrial Engineering &amp; B.A. Economics",
      "o": "Pontificia Universidad Javeriana · Bogotá",
      "m": "2020 – 2025 · <em>Dual degree</em>"
    }
  ],
  "plates": [
    {
      "img": "assets/visualizations/bogota_crime_lamps.jpg",
      "k": "PLATE I",
      "t": "Crime Victims and Public Lighting in Bogotá",
      "tags": "SPATIAL ANALYTICS · BIVARIATE CHOROPLETH",
      "d": "Distribution of crime victims across Bogotá's localities against public lighting coverage. Explores the relationship between infrastructure gaps and victimization rates using disaggregated municipal data."
    },
    {
      "img": "assets/visualizations/metro_poverty_map.jpg",
      "k": "PLATE II",
      "t": "Multidimensional Poverty and Metro Corridor",
      "tags": "URBAN POLICY · GEOSPATIAL OVERLAY",
      "d": "Overlay of Bogotá's multidimensional poverty index with the planned metro line corridor. Assesses the degree to which the first metro line serves the city's most deprived neighborhoods."
    },
    {
      "img": "assets/visualizations/canopy_height.jpg",
      "k": "PLATE III",
      "t": "Urban Canopy Height Mapping",
      "tags": "GEOSPATIAL DATA · REMOTE SENSING",
      "d": "High-resolution mapping of urban tree canopy height. Part of broader analysis on urban green infrastructure, heat island effects, and environmental equity across Bogotá's urban fabric."
    },
    {
      "img": "assets/visualizations/gdp_distribution.jpg",
      "k": "PLATE IV",
      "t": "GDP Distribution Across Colombian Departments",
      "tags": "ECONOMIC VISUALIZATION · REGIONAL DATA",
      "d": "GDP concentration across Colombia's 32 departments — the dominant share of Bogotá D.C. and Antioquia in national output and context for spatial development policy analysis."
    }
  ],
  "chron": [
    {
      "d": "OCT 2026", // TODO(esteban): confirmar fecha
      "b": "Launched <a href=\"https://ceteris-paribus-pearl.vercel.app/\" rel=\"noopener\" target=\"_blank\"><em>Ceteris Paribus</em></a> — an interactive platform to learn microeconomics with games and live charts, starting with the full Uniandes advanced-micro syllabus."
    },
    {
      "d": "SEP 2026", // TODO(esteban): confirmar fecha
      "b": "Started <em>active-equity-desk</em> to run a COP 100M equity book in the Bolsa Millonaria competition (bvc × trii)."
    },
    {
      "d": "JUN 2026",
      "b": "Working paper “A Hybrid Early-Warning System for Inflation in an Emerging Market” posted on <a href=\"https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6625578\" rel=\"noopener\" target=\"_blank\">SSRN</a> — in preparation for submission to <em>Economic Modelling</em>."
    },
    {
      "d": "MAY 2026",
      "b": "Released <a href=\"https://github.com/Stebandido77/pulso\" rel=\"noopener\" target=\"_blank\"><em>pulso</em></a> <code>v1.0.0-rc1</code> on <a href=\"https://test.pypi.org/project/pulso/\" rel=\"noopener\" target=\"_blank\">TestPyPI</a> — an open-source Python library for loading and harmonizing GEIH microdata from Colombia’s DANE across the 2022 methodological redesign. Now stable on <a href=\"https://pypi.org/project/pulso-co/\" rel=\"noopener\" target=\"_blank\">PyPI</a> as <code>pulso-co</code>."
    },
    {
      "d": "APR 2026",
      "b": "Paper “Point Forecasts, Density Signals, and the Limits of Parsimony” submitted for editorial review at <em>Emerging Markets Review</em>."
    },
    {
      "d": "MAR 2026",
      "b": "New working paper in development: multi-agent architecture with LLM integration for real-time monitoring of inflation expectations in emerging markets."
    },
    {
      "d": "MAR 2026",
      "b": "Published on X: <a href=\"https://x.com/Stbandido_/status/2021030767325839814\" rel=\"noopener\" target=\"_blank\"><em>Escribir cuando callar es cómodo</em></a> — a reflection on writing as transcendence."
    },
    {
      "d": "FEB 2026",
      "b": "Expanding work at the intersection of derivatives valuation and regulatory risk — including SA-CCR exposure engines aligned with SFC standards."
    },
    {
      "d": "FEB 2026",
      "b": "Published on X: <a href=\"https://x.com/Stbandido_/status/2033785801872384477\" rel=\"noopener\" target=\"_blank\"><em>Salario mínimo, informalidad y estructura del ingreso en Colombia</em></a> — where the minimum wage actually sits within the real income distribution."
    },
    {
      "d": "JAN 2026",
      "b": "Started M.Sc. in Applied Economics at Universidad de los Andes. Research focus: macroeconomics, inflation dynamics, monetary policy in Colombia."
    }
  ],
  "voice": [
    {"id": "v1", "d": "February 2026", "t": "Salario mínimo, informalidad y estructura del ingreso en Colombia", "b": "An analysis of where the minimum wage actually sits within Colombia's real income distribution — beyond the usual inflation-versus-business-pressure debate.", "s": "Thread · Labor · Policy · Data", "url": "https://x.com/Stbandido_/status/2033785801872384477"},
    {"id": "v2", "d": "March 2026", "t": "Escribir cuando callar es cómodo", "b": "A reflection on writing as an act of transcendence — how, since the earliest civilizations, writing has been humanity's way of refusing to disappear entirely.", "s": "2.1K views · 47 reposts · Essay", "url": "https://x.com/Stbandido_/status/2021030767325839814"},
    {"id": "v3", "d": "Ongoing", "t": "Writing in public", "b": "Commentary on Colombian economics: labor markets, inflation, income distribution and monetary policy. Shorter, sharper and public — the counterpart to the papers.", "s": "@Stbandido_ on X", "url": "https://x.com/Stbandido_"}
  ],
  "heroMeta": [
    [
      "Position",
      "Analyst · Strategy & Investor Relations · Grupo Aval"
    ],
    [
      "Academic",
      "M.Sc. Applied Economics · Universidad de los Andes"
    ],
    [
      "Current Focus",
      "Inflation forecasting · Capital markets · M&A · Corporate valuation"
    ],
    [
      "Affiliated with",
      "Sekia Research Group · Pontificia Universidad Javeriana"
    ]
  ],
  "interests": [
    "Time Series Econometrics",
    "Applied Microeconometrics",
    "Financial Decision-Making",
    "Game Theory",
    "Education",
    "Development Economics",
    "Mergers & Acquisitions",
    "Corporate Valuation",
    "Private Capital Markets"
  ],
  "bio": "Increasingly focused on <em>mergers, acquisitions, and corporate valuation</em> — where financial modeling meets strategic judgment — the bridge between strategy work at a banking group and capital-markets research.",
  "thesis": "“ I work between markets and models — valuing banks and deals by day, forecasting inflation at night, and writing about Colombia in between. ”",

  /* Investigaciones en diseño ("On the desk" en Research). */
  "pipeline": [
    {"title": "After the Ponzi: cohort effects of the DMG collapse", "venue": "Working title · in design", "abstract": "Cohort × intensity difference-in-differences with a Bayesian learning model in the spirit of Malmendier & Nagel, on ELCA panel data. Outcomes: trust and financial sophistication across municipalities.", "tags": "DiD · ELCA · BEHAVIORAL FINANCE"},
    {"title": "Bre-B and deposit-market competition", "venue": "Working title · in design", "abstract": "How Colombia's instant-payment system changes competition for deposits. Difference-in-differences on SFC and Banco de la República data.", "tags": "PAYMENTS · BANKING · DiD"},
    {"title": "Phones out: the UNCOLI school restriction", "venue": "Working title · in design", "abstract": "Impact of Bogotá's UNCOLI schools removing phones from classrooms. Individual-level Saber 11 outcomes, all other schools as counterfactual, parallel-trends validation.", "tags": "EDUCATION · IMPACT EVALUATION"},
    {"title": "The minimum wage and Colombian labor markets", "venue": "Working title · in design", "abstract": "Impact evaluation with exposure-based counterfactuals: industries with more versus fewer minimum-wage workers, and workers just above the minimum.", "tags": "LABOR · GEIH · IMPACT EVALUATION"}
  ],

  /* Categoría de cada proyecto (por número): markets | research | oss.
     Define la carpeta y el filtro en Projects. */
  "projectCategories": {"01": "markets", "02": "markets", "03": "research", "04": "research", "05": "markets", "06": "research", "07": "oss", "08": "oss", "09": "markets", "10": "markets", "11": "research", "12": "markets", "13": "research", "14": "oss"},

  /* Favoritos de Safari (Links): [nombre, url, glifo, color]. */
  "favorites": [
    ["SSRN · Early-warning paper", "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6625578", "S", "#1e4e8c"],
    ["Ceteris Paribus", "https://ceteris-paribus-pearl.vercel.app/", "c.p.", "#3e5a48"],
    ["pulso on GitHub", "https://github.com/Stebandido77/pulso", "py", "#2b2b2b"],
    ["pulso on PyPI", "https://pypi.org/project/pulso-co/", "Pi", "#3775a9"],
    ["GitHub", "https://github.com/Stebandido77", "GH", "#222"],
    ["LinkedIn", "https://www.linkedin.com/in/esteban-labastidas-cmsa%C2%AE-8272a019a/", "in", "#0a66c2"],
    ["X · @Stbandido_", "https://x.com/Stbandido_", "X", "#000"],
    ["Kaggle", "https://www.kaggle.com/elabastidas", "k", "#20beff"],
    ["Substack", "https://substack.com/@estebanlabastidas", "S", "#ff6719"],
    ["CV (PDF)", "assets/docs/CV_Esteban_Labastidas.pdf", "CV", "#8b2332"],
    ["The classic notebook", "classic/", "N", "#9a7440"]
  ],

  /* Contacto y enlaces usados en Mail, Terminal, menú "EL" y <noscript>. */
  "contact": {
    "email": "estebanlabastidasm@javeriana.edu.co",
    "cv": "assets/docs/CV_Esteban_Labastidas.pdf",
    "linkedin": "https://www.linkedin.com/in/esteban-labastidas-cmsa%C2%AE-8272a019a/",
    "github": "https://github.com/Stebandido77",
    "kaggle": "https://www.kaggle.com/elabastidas",
    "x": "https://x.com/Stbandido_",
    "substack": "https://substack.com/@estebanlabastidas"
  },

  /* Textos cortos de la interfaz. */
  "kicker": "Economist · Banker · Builder",
  "homeTagline": "Economist · banker · builder. Strategy & Investor Relations at Grupo Aval, Bogotá.",
  "resumeTitle": "Engineering, economics,<br><em>markets</em>, research.",
  "credentials": [
    {"d": "Certified", "t": "CMSA® · Capital Markets &amp; Securities Analyst", "o": "Corporate Finance Institute"},
    {"d": "In progress", "t": "FMVA® · Financial Modeling &amp; Valuation Analyst", "o": "Corporate Finance Institute"}
  ],
  "mail": {
    "subject": "Hello Esteban",
    "body": "Hi Esteban,\n\nI saw your notebook and wanted to talk about ",
    "note": "Research collaborations, M&A and valuation work, policy conversations. If your mail app doesn't open, copy the address."
  },

  /* Palabras que forman el retrato en About; las de "portraitKeyWords" salen en ámbar. */
  "portraitWords": ["Economist", "Banker", "Builder", "M&A", "Valuation", "Grupo Aval", "Strategy", "Investor Relations", "Inflation", "Forecasting", "Bayesian", "TVP-BVAR-SV", "Density", "SA-CCR", "Calypso", "Derivatives", "Capital markets", "Uniandes", "Javeriana", "CMSA®", "FMVA®", "Python", "R", "VBA", "LaTeX", "Bogotá", "Sekia", "SSRN", "Emerging markets", "Writer", "@Stbandido_", "pulso", "GEIH", "andina", "TES", "Patrion", "JPMorgan", "Management Solutions", "Models", "Markets", "Spatial", "Econometrics", "Colombia", "DCF", "WACC", "Comps", "Board", "Curves", "Ceteris Paribus", "Saber 11"],
  "portraitKeyWords": ["Economist", "Banker", "Builder", "M&A", "Valuation", "Inflation"],

  /* Música de fondo. Por defecto es generativa (Web Audio), sin archivos ni licencias.
     TODO(esteban): para usar pistas propias, sube los .mp3 (CC0 o con licencia que permita uso web)
     a assets/audio/, crea assets/audio/playlist.json con
       {"tracks": [{"title": "…", "src": "assets/audio/pista.mp3", "credit": "Autor · Licencia"}]}
     y cambia "playlist" a "assets/audio/playlist.json". */
  "music": {"playlist": null},

  /* Datos de mercado — FIJOS, no se consultan APIs.
     Para actualizarlos: cambia los valores y la fecha "asOf" (y la nota de cada uno).
       banrep: tasa de política del Banco de la República (banrep.gov.co).
       cpi:    inflación anual del IPC publicada por el DANE (dane.gov.co).
       usdcop: TRM o cierre del dólar del día indicado.
     La menubar, la pantalla de inicio móvil y la app Markets leen de aquí.
     El gráfico de velas de Markets es SIMULADO y se ancla a usdcop.value. */
  "markets": {
    "asOf": "20 Oct 2026",
    "banrep": {"value": 12.25, "label": "12.25%", "note": "▲ 25 bp · 30 Sep 26", "short": "▲ 25 bp"},
    "cpi": {"value": 6.29, "label": "6.29%", "note": "Sep 2026", "short": "Sep"},
    "usdcop": {"value": 3163.60, "label": "3,163.60", "compact": "3,164", "note": "20 Oct 2026", "short": "20 Oct"}
  },

  /* EL·IA — asistente sin LLM: una red neuronal pequeña (tools/elia/) clasifica la pregunta en una
     de estas intenciones y muestra su respuesta. Texto plano (sin HTML).
       id     identificador; debe coincidir con la columna "intent" de tools/elia/data/questions.csv
       t      título corto (chips de "¿Te refieres a…?" y Spotlight)
       a      la respuesta: qué es
       how    opcional: cómo se hizo (datos, método, stack, decisiones). Se muestra cuando la red
              detecta una pregunta de "cómo" (salida asks_how) o con el botón "Cómo lo hizo"
       open   opcional: [[app, selección], …]: un botón por app relacionada (el primero es el principal)
       dynamic opcional: la app arma la respuesta en tiempo de ejecución ("chron" = 3 entradas más recientes)
       links  opcional: [[texto, url], …]
     Si agregas o renombras una intención, agrega preguntas al CSV y reentrena:
       python tools/elia/train.py
     Lo marcado con TODO(esteban) es un borrador inferido: revísalo antes de publicar. */
  "elia": {
    "threshold": 0.6,
    "margin": 0.0,
    "howThreshold": 0.5,
    "keyMode": "mix",
    "keyWeight": 0.4,
    "clarify": 0.3,           // debajo de esto no hay "¿Te refieres a…?": se ofrece escribirle a Esteban
    "formEndpoint": null,
    /* keys: alias distintivos (texto normalizado: minúsculas, sin tildes ni signos). Si la pregunta contiene
       los de una sola intención (exactos, o a 1 letra de distancia en palabras de 5+ letras), esa
       intención sube de probabilidad; si aparecen los de dos intenciones, decide solo la red. */
    "intents": [
      /* ── proyectos ── */
      {"id": "proj_saccr", "t": {"es": "Motor de exposición SA-CCR", "en": "SA-CCR exposure engine"},
       "keys": ["sa ccr", "saccr", "exposicion contraparte", "exposicion a contraparte", "counterparty exposure", "motor de exposicion", "exposure engine"],
       "a": {"es": "Una calculadora completa de exposición a riesgo de contraparte bajo SA-CCR para portafolios de derivados de FX y tasas, alineada con la regulación de la SFC. Se usó para medir capital regulatorio, hacer pruebas de estrés y reportar riesgo en una institución financiera colombiana de primer nivel.",
             "en": "A fully functional SA-CCR counterparty credit risk exposure calculator for FX and rates derivatives portfolios, aligned with SFC regulation. It was used for regulatory capital, stress testing and risk reporting at a tier-1 Colombian financial institution."},
       // TODO(esteban): "how" inferido de la metodología estándar SA-CCR; confirma el detalle.
       "how": {"es": "Está escrito en Python y sigue el método estándar de SA-CCR: costo de reposición más el add-on de exposición potencial futura por clase de activo (FX y tasas), con conjuntos de compensación y de cobertura, factores supervisores, factor de madurez y el alfa de 1,4. Se construyó durante la consultoría en Management Solutions, alineado con los estándares de la SFC.",
               "en": "It is written in Python and follows the standard SA-CCR method: replacement cost plus the potential future exposure add-on per asset class (FX and rates), with netting and hedging sets, supervisory factors, the maturity factor and the 1.4 alpha. It was built during the consulting work at Management Solutions, aligned with SFC standards."},
       "open": [["projects", "01"]]},
      {"id": "proj_calypso", "t": {"es": "Implementación de Calypso", "en": "Calypso implementation"},
       "keys": ["calypso", "nasdaq", "sistema de tesoreria", "treasury system", "banco estatal", "state owned bank"],
       "a": {"es": "Implementación de punta a punta del sistema de tesorería Calypso (Nasdaq) en front, middle y back office para un gran banco estatal colombiano: herramientas de valoración, flujos de operaciones, integración de datos de mercado y reglas contables.",
             "en": "An end-to-end implementation of the Calypso (Nasdaq) treasury system across front, middle and back office for a major state-owned Colombian bank: pricing tools, trade workflows, market data integrations and accounting rules."},
       // TODO(esteban): agrega detalles concretos del proyecto (fases, tu rol, duración) si se pueden publicar.
       "how": {"es": "Fue un proyecto de consultoría en Management Solutions. Esteban participó en todo el ciclo: configuración de valoración, flujos de operaciones desde la mesa hasta la liquidación, conexión de datos de mercado y reglas contables.",
               "en": "It was a consulting engagement at Management Solutions. Esteban took part in the whole cycle: pricing setup, trade workflows from the desk to settlement, market data connections and accounting rules."},
       "open": [["projects", "02"]]},
      {"id": "proj_inflation", "t": {"es": "Sistema de pronóstico de inflación", "en": "Inflation forecasting system"},
       "keys": ["pipeline", "infraestructura", "infrastructure", "benchmarking", "sistema de pronostico", "forecasting system"],
       "a": {"es": "Un pipeline de calidad de producción para comparar modelos de pronóstico de inflación en Colombia. Es la infraestructura de los papers 01 y 02: los resultados de \"Point Forecasts, Density Signals, and the Limits of Parsimony\" salen de aquí.",
             "en": "A production-grade pipeline for benchmarking inflation forecasting models for Colombia. It is the infrastructure behind papers 01 and 02: the results in \"Point Forecasts, Density Signals, and the Limits of Parsimony\" come from it."},
       "how": {"es": "Combina ARIMA, VAR bayesianos y modelos con parámetros que cambian en el tiempo (TVP-BVAR-SV), con backtests de ventana móvil y pruebas de Diebold–Mariano. Está hecho en R y Python.",
               "en": "It combines ARIMA, Bayesian VARs and time-varying parameter models (TVP-BVAR-SV), with rolling-window backtests and Diebold–Mariano tests. It is built in R and Python."},
       "open": [["projects", "03"], ["research", "01"]]},
      {"id": "ews", "t": {"es": "Alerta temprana de inflación (multiagente)", "en": "Inflation early warning (multi-agent)"},
       "keys": ["early warning", "alerta temprana", "alertas tempranas", "multiagente", "multi agente", "multi agent", "multiagent", "hibrido", "hybrid", "economic modelling", "ssrn", "agentes", "agents"],
       "a": {"es": "\"A Hybrid Early-Warning System for Inflation in an Emerging Market\" es un working paper en SSRN, en preparación para Economic Modelling, con un prototipo multiagente detrás. Aplicado al IPC de Colombia, supera a los modelos econométricos de referencia en detectar cambios de régimen y en calibrar densidades de corto plazo.",
             "en": "\"A Hybrid Early-Warning System for Inflation in an Emerging Market\" is a working paper on SSRN, in preparation for Economic Modelling, with a multi-agent prototype behind it. Applied to Colombian CPI, it beats benchmark econometric models at detecting regime changes and at short-horizon density calibration."},
       // TODO(esteban): ¿qué LLM y qué stack usa el prototipo? Agrégalo si es público.
       "how": {"es": "Tres piezas trabajan juntas: modelos econométricos clásicos para el pronóstico base, un modelo basado en agentes con expectativas heterogéneas que descompone la inflación y un LLM que extrae señales de narrativa en tiempo real. Una arquitectura de agentes con múltiples salidas las orquesta.",
               "en": "Three pieces work together: classical econometric models for the baseline forecast, an agent-based model with heterogeneous expectations that decomposes inflation, and an LLM that extracts narrative signals in real time. A multi-output agent architecture orchestrates them."},
       "open": [["research", "02"], ["projects", "04"]],
       "links": [["SSRN", "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6625578"]]},
      {"id": "jpm", "t": {"es": "JP Morgan Chase", "en": "JP Morgan Chase"},
       "keys": ["jp morgan", "jpmorgan", "jpm", "chase", "morgan", "internship", "intern", "pasantia"],
       "a": {"es": "De junio de 2024 a enero de 2025 fue ED&SE Intern en JP Morgan Chase. Construyó dashboards internos y flujos automatizados para monitorear el desempeño de inversiones y reducir los reportes manuales, en analítica de finanzas y de fuerza laboral.",
             "en": "From June 2024 to January 2025, Esteban was an ED&SE Intern at JP Morgan Chase, building internal dashboards and automated workflows to monitor investment performance and cut manual reporting, across finance and workforce analytics."},
       "how": {"es": "Pipelines de datos en Python alimentan dashboards en Power BI, y herramientas automatizadas siguen las métricas de inversión.",
               "en": "Python data pipelines feed Power BI dashboards, and automated tools track the investment metrics."},
       "open": [["projects", "05"], ["path"]]},
      {"id": "mediabias", "t": {"es": "Sesgo mediático en protestas", "en": "Media bias in protests"},
       "keys": ["sesgo", "sesgos", "bias", "media bias", "sesgo mediatico", "protestas", "protests", "cinep", "cobertura", "coverage", "paro nacional"],
       "a": {"es": "\"Media Bias in Coverage of Social Protests in Colombia\" es un working paper con el CINEP y el Grupo Sekia (octubre de 2023) que evalúa posibles sesgos en la cobertura de las protestas sociales en los medios colombianos. Viene con su propio dataset estructurado.",
             "en": "\"Media Bias in Coverage of Social Protests in Colombia\" is a working paper with CINEP and the Sekia group (October 2023) that assesses possible biases in Colombian news coverage of social protests. It comes with its own structured dataset."},
       "how": {"es": "Esteban construyó la base de datos de cobertura y el análisis exploratorio con NLP sobre los principales medios, en R y Python.",
               "en": "Esteban built the coverage database and the exploratory NLP analysis across the main outlets, in R and Python."},
       "open": [["research", "06"], ["projects", "06"]]},
      {"id": "proj_pulso", "t": {"es": "pulso — microdatos de la GEIH", "en": "pulso — GEIH microdata"},
       "keys": ["pulso", "pulso co", "geih", "gran encuesta integrada", "encuesta de hogares", "household survey", "dane"],
       "a": {"es": "pulso es una librería de Python de código abierto que carga en una línea los microdatos de la Gran Encuesta Integrada de Hogares (GEIH) del DANE, de 2006 a hoy, y los armoniza entre épocas, incluido el rediseño metodológico de 2022 y la serie Empalme. Se instala con pip install pulso-co.",
             "en": "pulso is an open-source Python library that loads microdata from DANE's Gran Encuesta Integrada de Hogares (GEIH), Colombia's monthly household survey, in one line, from 2006 to the present, and harmonizes it across epochs, including the 2022 methodological redesign and the Empalme series. Install it with pip install pulso-co."},
       "how": {"es": "Hace tres cosas: descarga el ZIP oficial del DANE, lo guarda en caché y verifica su SHA-256; lee los tres formatos del DANE (Cabecera/Resto 2006–2021, archivo nacional desde 2022 y los ZIP anuales del Empalme); y traduce los códigos crudos (P6020, FEX_C18…) a variables con nombre, consistentes entre épocas. Se construyó con un sistema multiagente de Claude diseñado y dirigido por Esteban: un Architect para el diseño y la revisión, un Builder para el código y un Curator para el catálogo de datos.",
               "en": "It does three things: downloads the official DANE ZIP, caches it and checks its SHA-256; parses DANE's three layouts (Cabecera/Resto 2006–2021, a single national file since 2022 and the annual Empalme ZIPs); and maps raw codes (P6020, FEX_C18…) to named variables that stay consistent across epochs. It was built with a Claude-based multi-agent system that Esteban designed and directed: an Architect for design and review, a Builder for the code and a Curator for the data catalog."},
       "open": [["projects", "07"]],
       "links": [["GitHub", "https://github.com/Stebandido77/pulso"], ["PyPI", "https://pypi.org/project/pulso-co/"]]},
      {"id": "proj_patrion", "t": {"es": "Patrion — gestión patrimonial", "en": "Patrion — wealth management"},
       "keys": ["patrion", "patrimonio", "wealth management", "gestion patrimonial", "personal finance", "finanzas personales"],
       "a": {"es": "Patrion es una app de gestión patrimonial personal, en desarrollo. Quiere dar a inversionistas minoristas y a hogares de alto patrimonio una vista estructurada de activos, pasivos, flujos de caja y exposiciones de riesgo, entre las apps de gastos y la analítica institucional de portafolios.",
             "en": "Patrion is a personal wealth management app in development. It aims to give retail investors and high-net-worth households a structured view of assets, liabilities, cash flows and risk exposures, bridging consumer expense trackers and institutional portfolio analytics."},
       // TODO(esteban): stack y decisiones de Patrion (no hay nada público todavía).
       "how": {"es": "Es un proyecto personal que aplica principios de valoración, riesgo y diseño de producto del trabajo diario. Todavía no hay detalles técnicos públicos.",
               "en": "It is a side project that applies valuation, risk and product design principles from the day job. There are no public technical details yet."},
       "open": [["projects", "08"]]},
      {"id": "proj_abi", "t": {"es": "Aval Banking Intelligence (ABI)", "en": "Aval Banking Intelligence (ABI)"},
       "keys": ["abi", "aval banking intelligence", "banking intelligence", "inteligencia bancaria", "seguimiento comercial", "commercial tracking"],
       "a": {"es": "ABI es un sistema de análisis y seguimiento comercial de la industria bancaria colombiana en Grupo Aval. Alimenta el trabajo de estrategia, de Junta Directiva y de relación con inversionistas.",
             "en": "ABI is an analysis and commercial-tracking system for the Colombian banking industry at Grupo Aval. It feeds strategy, Board and investor work."},
       "how": {"es": "Es un lakehouse en Python que une datos regulatorios (SFC), de mercado y de competencia, y sirve como columna analítica de la función de estrategia.",
               "en": "It is a Python lakehouse that joins regulatory (SFC), market and competitive data, and serves as the analytical backbone of the strategy function."},
       "open": [["projects", "09"]]},
      {"id": "proj_andina", "t": {"es": "andina — curva de TES", "en": "andina — TES yield curve"},
       "keys": ["andina", "tes", "curva de rendimientos", "yield curve", "nelson siegel", "svensson", "bonos", "bonds", "curva soberana", "sovereign curve"],
       "a": {"es": "andina es una herramienta para la curva de rendimientos soberana de Colombia: ajusta Nelson–Siegel–Svensson sobre los TES e incluye analítica completa de bonos (precio, duración, convexidad y carry).",
             "en": "andina is a toolkit for Colombia's sovereign yield curve: it fits Nelson–Siegel–Svensson on TES and includes full bond analytics (pricing, duration, convexity and carry)."},
       // TODO(esteban): método de estimación (¿mínimos cuadrados no lineales sobre precios o tasas?) y fuente de datos.
       "how": {"es": "Está en Python. Ajusta los parámetros de Nelson–Siegel–Svensson a los TES observados y, con la curva ajustada, valora cada bono y calcula duración, convexidad y carry.",
               "en": "It is written in Python. It fits the Nelson–Siegel–Svensson parameters to observed TES and uses the fitted curve to price each bond and compute duration, convexity and carry."},
       "open": [["projects", "10"]]},
      {"id": "proj_ceteris", "t": {"es": "Ceteris Paribus", "en": "Ceteris Paribus"},
       "keys": ["ceteris", "ceteris paribus", "paribus", "microeconomia", "microeconomics", "varian", "wooldridge", "juego de mercado", "market game"],
       "a": {"es": "Ceteris Paribus es una plataforma interactiva para aprender microeconomía, econometría y macro, basada en Varian y Wooldridge. Ya está en línea y arranca con todo el temario de micro avanzada de Uniandes.",
             "en": "Ceteris Paribus is an interactive platform to learn microeconomics, econometrics and macro, built on Varian and Wooldridge. It is live and starts with the full Uniandes advanced-micro syllabus."},
       "how": {"es": "Es una app web en Next.js desplegada en Vercel. Las lecciones están escritas en MDX con componentes interactivos, y la matemática vive aparte, en motores puros con pruebas (mercado, MCO…) que son la fuente de verdad de cada gráfica. El juego de mercado simula muchos agentes que fijan precios y convergen al equilibrio, con choques de oferta y demanda, impuestos y controles de precios. El código no es público; la plataforma sí.",
               "en": "It is a Next.js web app deployed on Vercel. Lessons are written in MDX with interactive components, and the math lives separately in pure, tested engines (market, OLS…) that are the source of truth for every chart. The market game simulates many agents setting prices that converge to equilibrium, with supply and demand shocks, taxes and price controls. The code is not public; the platform is."},
       "open": [["projects", "11"]],
       "links": [["Ceteris Paribus", "https://ceteris-paribus-pearl.vercel.app/"]]},
      {"id": "ceteris_code", "t": {"es": "Código de Ceteris Paribus", "en": "Ceteris Paribus source code"},
       "keys": ["codigo de ceteris", "ceteris code", "repo de ceteris", "repositorio", "repository", "codigo fuente", "source code", "github", "open source", "codigo abierto"],
       "a": {"es": "El repositorio de Ceteris Paribus es privado, pero la plataforma es pública y la puedes usar. Si te interesa el código o colaborar, escríbele a Esteban.",
             "en": "The Ceteris Paribus repository is private, but the platform is public and free to use. If you're interested in the code or in collaborating, write to Esteban."},
       "open": [["mail"]],
       "links": [["Ceteris Paribus", "https://ceteris-paribus-pearl.vercel.app/"]]},
      {"id": "proj_equitydesk", "t": {"es": "active-equity-desk", "en": "active-equity-desk"},
       "keys": ["active equity desk", "equity desk", "bolsa millonaria", "trii", "bvc", "portafolio de acciones", "stock portfolio"],
       "a": {"es": "Un sistema de gestión activa de portafolio para el concurso Bolsa Millonaria (bvc × trii): un libro de acciones de COP 100 millones, pensado para seguir creciendo como sistema de inversión real.",
             "en": "An active portfolio-management system for the Bolsa Millonaria competition (bvc × trii): a COP 100M equity-only book, designed to keep growing into a real investment system."},
       "how": {"es": "Está en Python, con un flujo de investigación basado en agentes inspirado en TradingAgents.",
               "en": "It is written in Python, with an agent-based research workflow inspired by TradingAgents."},
       "open": [["projects", "12"]]},
      {"id": "proj_pgn", "t": {"es": "PGN, línea por línea", "en": "PGN, line by line"},
       "keys": ["pgn", "presupuesto", "presupuesto general", "budget"],
       "a": {"es": "Adónde va el Presupuesto General de la Nación y cómo se compara el proyecto de este año con el del anterior. Son gráficas hechas para explicar el presupuesto en público.",
             "en": "Where Colombia's Presupuesto General de la Nación goes, and how this year's bill compares with last year's. Charts built to explain the budget in public."},
       // TODO(esteban): datos, herramientas y dónde se publicaron las gráficas.
       "how": {"es": "Es un proyecto de visualización de datos de finanzas públicas. Todavía no hay detalles técnicos publicados en el sitio.",
               "en": "It is a public-finance data visualization project. The site does not list technical details yet."},
       "open": [["projects", "13"]]},
      {"id": "proj_whoop", "t": {"es": "WHOOP Lab", "en": "WHOOP Lab"},
       "keys": ["whoop", "whoop lab", "wearable", "recovery", "recuperacion", "strain", "hrv"],
       "a": {"es": "WHOOP Lab es un dashboard local de código abierto para analizar la exportación oficial de datos de WHOOP. Corre en el navegador y no sube nada a ningún servidor.",
             "en": "WHOOP Lab is an open-source local dashboard to analyze the official WHOOP data export. It runs in the browser and never uploads anything."},
       "how": {"es": "Está en TypeScript y todo corre en el cliente. Estima el efecto de los hábitos con una regresión que controla por sueño, esfuerzo del día anterior, hora de dormir y efectos fijos, en vez de una diferencia de medias. También estima una respuesta al impulso del esfuerzo con rezagos distribuidos, usa errores HAC de Newey–West y controla comparaciones múltiples con Benjamini–Hochberg. Lee las exportaciones en español comparando encabezados sin tildes.",
               "en": "It is written in TypeScript and runs entirely client-side. It estimates habit effects with a regression that controls for sleep, the previous day's strain, bedtime and fixed effects, instead of a difference of means. It also estimates a strain impulse response with distributed lags, uses Newey–West HAC errors and controls multiplicity with Benjamini–Hochberg. Spanish exports are read by matching accent-folded headers."},
       "open": [["projects", "14"]],
       "links": [["GitHub", "https://github.com/Stebandido77/whoop-lab"]]},

      /* ── papers ── */
      {"id": "paper_parsimony", "t": {"es": "Los límites de la parsimonia", "en": "The limits of parsimony"},
       "keys": ["parsimonia", "parsimony", "emerging markets review", "density", "densidad", "densidades", "point forecasts", "pronosticos puntuales", "regimenes", "regimes", "calibracion", "calibration"],
       "a": {"es": "\"Point Forecasts, Density Signals, and the Limits of Parsimony\" compara modelos de pronóstico de inflación para Colombia en distintos regímenes de política monetaria. Encuentra que la calibración de los pronósticos de densidad, más que la precisión puntual, muestra dónde falla la parsimonia. Está en revisión editorial en Emerging Markets Review, con coautores. Los cálculos corren sobre el sistema de pronóstico de inflación, la infraestructura de los papers 01–02.",
             "en": "\"Point Forecasts, Density Signals, and the Limits of Parsimony\" benchmarks inflation forecasting models for Colombia across monetary policy regimes. It finds that density forecast calibration, more than point accuracy, shows where parsimony breaks down. It is under editorial review at Emerging Markets Review, with collaborators. The computations run on the inflation forecasting system, the infrastructure behind papers 01–02."},
       "how": {"es": "Va de modelos univariados parsimoniosos (Random Walk, AR, ARX) a modelos bayesianos estructurales (BVAR con prior de Minnesota y TVP-BVAR-SV siguiendo a Primiceri, 2005), y los evalúa por precisión puntual y por calibración de densidad en cada régimen.",
               "en": "It goes from parsimonious univariate models (Random Walk, AR, ARX) to Bayesian structural models (BVAR with a Minnesota prior and TVP-BVAR-SV following Primiceri, 2005), and evaluates them on point accuracy and density calibration within each regime."},
       "open": [["research", "01"], ["projects", "03"]]},
      {"id": "paper_banking", "t": {"es": "Riesgo en la banca colombiana", "en": "Risk in Colombian banking"},
       "keys": ["sistema bancario", "banking system", "banca colombiana", "colombian banking", "transmision de riesgo", "risk transmission", "capital adequacy", "dinamicas estructurales", "structural dynamics"],
       "a": {"es": "\"Structural Dynamics and Risk Transmission in the Colombian Banking System\" (título provisional) es una investigación en curso sobre suficiencia de capital, cumplimiento regulatorio y riesgo de contraparte en la banca colombiana bajo estándares de la SFC. El resumen completo está por publicarse.",
             "en": "\"Structural Dynamics and Risk Transmission in the Colombian Banking System\" (working title) is ongoing research on capital adequacy, regulatory compliance and counterparty credit risk in Colombian banking under SFC standards. The full abstract is forthcoming."},
       // TODO(esteban): método y datos del paper 03.
       "how": {"es": "Hace énfasis en la dinámica de la exposición SA-CCR y en los canales de transmisión sistémica. La metodología completa todavía no es pública.",
               "en": "It focuses on SA-CCR exposure dynamics and systemic transmission channels. The full methodology is not public yet."},
       "open": [["research", "03"]]},
      {"id": "paper_llm", "t": {"es": "LLMs en pronóstico macro", "en": "LLMs in macro forecasting"},
       "keys": ["llm", "llms", "large language models", "modelos de lenguaje", "gpt"],
       "a": {"es": "\"Large Language Models in Macroeconomic Forecasting: Architectures and Empirical Evidence\" (título provisional) explora la frontera entre el pronóstico econométrico clásico y las arquitecturas modernas de IA. Está en curso.",
             "en": "\"Large Language Models in Macroeconomic Forecasting: Architectures and Empirical Evidence\" (working title) explores the frontier between classical econometric forecasting and modern AI architectures. It is in progress."},
       "how": {"es": "Evalúa sistemas multiagente, LLMs ajustados (fine-tuned) y pipelines híbridos econometría-IA frente a los benchmarks tradicionales.",
               "en": "It evaluates multi-agent systems, fine-tuned LLMs and hybrid econometric-AI pipelines against traditional benchmarks."},
       "open": [["research", "04"]]},
      {"id": "paper_coca", "t": {"es": "Coca y rendimiento académico", "en": "Coca and academic performance"},
       "keys": ["coca", "cultivos de coca", "coca crops", "cultivos ilicitos", "illicit crops", "hectareas", "hectares"],
       "a": {"es": "\"Effects of Coca Crops on Academic Performance in Colombia (2018–2021)\" se publicó con el Grupo de Investigación Sekia de la Javeriana en noviembre de 2023. Una desviación estándar más de hectáreas cultivadas reduce el puntaje promedio en cerca de 0,03 desviaciones estándar. Ganó la convocatoria de semilleros de FENADECO y el concurso de investigación en Economía de la Javeriana.",
             "en": "\"Effects of Coca Crops on Academic Performance in Colombia (2018–2021)\" was published with Javeriana's Sekia Research Group in November 2023. A one standard deviation increase in cultivated hectares reduces average scores by about 0.03 standard deviations. It won the FENADECO Research Seedbeds Call and Javeriana's Economics Research Competition."},
       // TODO(esteban): estrategia de identificación (¿efectos fijos, variables instrumentales?).
       "how": {"es": "Es un análisis a nivel municipal con los puntajes de las pruebas SABER 11 para cuantificar el efecto causal del cultivo de coca en los resultados educativos.",
               "en": "It is a municipal-level analysis using SABER 11 test scores to quantify the causal effect of coca cultivation on educational outcomes."},
       "open": [["research", "05"]]},
      {"id": "paper_bornthisway", "t": {"es": "Born This Way", "en": "Born This Way"},
       "keys": ["born this way", "nacido asi", "nacidos asi", "estudiantes de medicina", "medical students", "demografia", "demographics"],
       "a": {"es": "\"Born This Way\" es un working paper interdisciplinario hecho con estudiantes de medicina (Grupo Sekia, marzo de 2023), en un tema relevante para la demografía de la salud y la política social en Colombia.",
             "en": "\"Born This Way\" is an interdisciplinary working paper developed with medical students (Sekia group, March 2023), on a topic relevant to health demographics and social policy in Colombia."},
       "how": {"es": "Esteban aportó al diseño estadístico, al análisis de datos y a la interpretación de resultados.",
               "en": "Esteban contributed to the statistical design, the data analysis and the interpretation of results."},
       "open": [["research", "07"]]},
      {"id": "paper_spatial", "t": {"es": "Desigualdad espacial en Bogotá", "en": "Spatial inequality in Bogotá"},
       "keys": ["desigualdad espacial", "spatial inequality", "espacial", "spatial", "hot spots", "puntos calientes", "localidades", "localities", "usaquen", "chapinero", "teusaquillo"],
       "a": {"es": "\"Spatial Inequality in Educational Performance Across Bogotá\" documenta la estructura espacial de los resultados educativos con microdatos Saber 11 del ICFES. Hay focos altos persistentes en el norte (Usaquén, Chapinero, Suba, Teusaquillo) y bajos en el sur (Ciudad Bolívar, Bosa, Usme, San Cristóbal). Es un working paper que va a SSRN.",
             "en": "\"Spatial Inequality in Educational Performance Across Bogotá\" documents the spatial structure of educational outcomes using ICFES Saber 11 microdata. There are persistent hot spots in the north (Usaquén, Chapinero, Suba, Teusaquillo) and cold spots in the south (Ciudad Bolívar, Bosa, Usme, San Cristóbal). It is a working paper headed to SSRN."},
       "how": {"es": "Agrega los datos en cuatro escalas (sede, ZAT, UPZ y UPL) con varias matrices de contigüidad, confirma la dependencia espacial con el I de Moran global y local, y estima un Modelo Espacial de Durbin agrupado: ocho covariables institucionales y del hogar tienen efectos indirectos (de derrame) significativos.",
               "en": "It aggregates the data at four scales (sede, ZAT, UPZ and UPL) with several contiguity matrices, confirms spatial dependence with global and local Moran's I, and estimates a pooled Spatial Durbin Model: eight institutional and household covariates have significant indirect (spillover) effects."},
       "open": [["research", "08"]]},

      /* ── investigaciones en diseño (pipeline) ── */
      {"id": "desk_dmg", "t": {"es": "Después de la pirámide DMG", "en": "After the DMG Ponzi"},
       "keys": ["dmg", "piramide", "ponzi", "esquema ponzi", "sofisticacion financiera", "financial sophistication"],
       "a": {"es": "Una investigación en diseño sobre los efectos de cohorte del colapso de DMG en la confianza y la sofisticación financiera en los municipios colombianos.",
             "en": "Research in design on the cohort effects of the DMG collapse on trust and financial sophistication across Colombian municipalities."},
       "how": {"es": "Diferencias en diferencias de cohorte por intensidad, con un modelo bayesiano de aprendizaje al estilo de Malmendier y Nagel, sobre los datos de panel de la ELCA.",
               "en": "A cohort × intensity difference-in-differences with a Bayesian learning model in the spirit of Malmendier and Nagel, on ELCA panel data."},
       "open": [["research", "D1"]]},
      {"id": "desk_breb", "t": {"es": "Bre-B y competencia por depósitos", "en": "Bre-B and deposit competition"},
       "keys": ["bre b", "breb", "pagos inmediatos", "instant payments", "instant payment", "depositos", "deposits"],
       "a": {"es": "Una investigación en diseño sobre cómo el sistema de pagos inmediatos de Colombia, Bre-B, cambia la competencia entre bancos por los depósitos.",
             "en": "Research in design on how Colombia's instant-payment system, Bre-B, changes competition among banks for deposits."},
       "how": {"es": "Diferencias en diferencias con datos de la SFC y del Banco de la República.",
               "en": "Difference-in-differences on SFC and Banco de la República data."},
       "open": [["research", "D2"]]},
      {"id": "desk_uncoli", "t": {"es": "Celulares fuera del aula (UNCOLI)", "en": "Phones out (UNCOLI)"},
       "keys": ["uncoli", "celulares", "celular", "phones", "phone", "telefonos", "smartphones"],
       "a": {"es": "Una investigación en diseño sobre el impacto de que los colegios UNCOLI de Bogotá sacaran los celulares de las aulas.",
             "en": "Research in design on the impact of Bogotá's UNCOLI schools removing phones from classrooms."},
       "how": {"es": "Usa resultados individuales de Saber 11, con el resto de colegios como contrafactual, y valida las tendencias paralelas.",
               "en": "It uses individual-level Saber 11 outcomes, with all other schools as the counterfactual, and validates parallel trends."},
       "open": [["research", "D3"]]},
      {"id": "desk_minwage", "t": {"es": "Salario mínimo y mercado laboral", "en": "Minimum wage and labor markets"},
       "keys": ["salario minimo", "minimum wage", "informalidad", "informality", "mercado laboral", "labor market", "labor markets", "hilo de x", "x thread"],
       "a": {"es": "Una investigación en diseño que evalúa el impacto del salario mínimo en los mercados laborales colombianos, con datos de la GEIH. El hilo en X \"Salario mínimo, informalidad y estructura del ingreso en Colombia\" adelanta dónde queda el mínimo dentro de la distribución real del ingreso.",
             "en": "Research in design evaluating the impact of the minimum wage on Colombian labor markets, using GEIH data. The X thread \"Salario mínimo, informalidad y estructura del ingreso en Colombia\" previews where the minimum wage sits within the real income distribution."},
       "how": {"es": "Evaluación de impacto con contrafactuales por exposición: industrias con más y con menos trabajadores de salario mínimo, y trabajadores justo por encima del mínimo.",
               "en": "Impact evaluation with exposure-based counterfactuals: industries with more versus fewer minimum-wage workers, and workers just above the minimum."},
       "open": [["research", "D4"]],
       "links": [["Hilo en X / X thread", "https://x.com/Stbandido_/status/2033785801872384477"]]},

      /* ── generales ── */
      {"id": "who", "t": {"es": "Quién es Esteban", "en": "Who Esteban is"},
       "keys": ["quien es esteban", "who is esteban", "quien es el", "who is he"],
       "a": {"es": "Esteban David Labastidas Martínez es economista e ingeniero industrial, de Bogotá. Trabaja entre mercados y modelos: valora bancos y negocios en Grupo Aval, investiga pronóstico de inflación y escribe sobre la economía colombiana. La versión corta: Economist · Banker · Builder.",
             "en": "Esteban David Labastidas Martínez is an economist and industrial engineer from Bogotá. The work sits between markets and models: valuing banks and deals at Grupo Aval, forecasting inflation in research, and writing about Colombia's economy. The short version: Economist · Banker · Builder."},
       "open": [["about"]]},
      {"id": "job_current", "t": {"es": "Trabajo actual", "en": "Current job"},
       "keys": ["trabajo actual", "current job", "current role", "donde trabaja", "where does he work", "where does esteban work", "grupo aval", "relacion con inversionistas", "investor relations", "planeacion estrategica", "strategic planning"],
       "a": {"es": "Desde 2026 es analista de Planeación Estratégica y Relación con Inversionistas en Grupo Aval, en Bogotá. Revisa el desempeño financiero de las filiales, evalúa M&A y proyectos corporativos, diseña escenarios de mediano y largo plazo y prepara materiales para la Junta Directiva, inversionistas institucionales y accionistas. También construye el pipeline Aval Banking Intelligence (ABI).",
             "en": "Since 2026, Esteban has been an Analyst in Strategic Planning & Investor Relations at Grupo Aval in Bogotá: reviewing subsidiaries' financial performance, evaluating M&A and corporate projects, designing medium- and long-term scenarios and preparing materials for the Board, institutional investors and shareholders. The role also includes building the Aval Banking Intelligence (ABI) pipeline."},
       "open": [["path"]]},
      {"id": "exp_ms", "t": {"es": "Management Solutions", "en": "Management Solutions"},
       "keys": ["management solutions", "consultor", "consultora", "consultant", "consulting", "consultoria"],
       "a": {"es": "En Management Solutions (Bogotá) fue Consultor de enero a septiembre de 2025 y Consultor II de septiembre de 2025 a 2026. Lideró frentes con ejecutivos C-level de bancos de primer nivel en estrategia de mercados de capitales, asesoría en gestión de activos y alineación regulatoria. Ahí construyó el motor SA-CCR y participó en la implementación de Calypso.",
             "en": "At Management Solutions (Bogotá), Esteban was a Consultant from January to September 2025 and Consultant II from September 2025 to 2026, leading workstreams with C-level executives at tier-1 banks on capital markets strategy, asset management advisory and regulatory alignment. That is where the SA-CCR engine was built and the Calypso implementation happened."},
       "open": [["path"]]},
      {"id": "exp_sekia", "t": {"es": "Grupo de Investigación Sekia", "en": "Sekia Research Group"},
       "keys": ["sekia", "semillero", "grupo de investigacion", "research group"],
       "a": {"es": "De agosto de 2023 a diciembre de 2025 lideró el Grupo de Investigación Sekia de la Pontificia Universidad Javeriana: coordinó investigación aplicada en econometría, análisis de datos, escritura académica y presentaciones, y gestionó publicaciones y colaboraciones externas, como la del CINEP.",
             "en": "From August 2023 to December 2025, Esteban led the Sekia Research Group at Pontificia Universidad Javeriana, coordinating applied research in econometrics, data analysis, academic writing and presentations, and managing publications and outside collaborations such as the one with CINEP."},
       "open": [["path"]]},
      {"id": "education", "t": {"es": "Formación", "en": "Education"},
       "keys": ["maestria", "master", "masters", "pregrado", "universidad", "university", "uniandes", "degree", "education", "educacion", "que estudio", "what did he study", "formacion academica"],
       "a": {"es": "Maestría en Economía Aplicada en la Universidad de los Andes (2026–2027, en curso); M.Sc. en Finanzas y Gestión Financiera en la Escuela Europea de Negocios, España (2024–2025); y doble titulación en Ingeniería Industrial y Economía en la Pontificia Universidad Javeriana (2020–2025).",
             "en": "M.Sc. in Applied Economics at Universidad de los Andes (2026–2027, in progress); M.Sc. in Finance & Financial Management at Escuela Europea de Negocios, Spain (2024–2025); and a dual degree in Industrial Engineering and Economics at Pontificia Universidad Javeriana (2020–2025)."},
       "open": [["path"]]},
      {"id": "certs", "t": {"es": "Certificaciones", "en": "Certifications"},
       "keys": ["certificaciones", "certificacion", "certifications", "certification", "certificates", "cmsa", "fmva"],
       "a": {"es": "CMSA® (Capital Markets & Securities Analyst) del Corporate Finance Institute, certificado; y FMVA® (Financial Modeling & Valuation Analyst), en curso.",
             "en": "CMSA® (Capital Markets & Securities Analyst) from the Corporate Finance Institute, certified; and FMVA® (Financial Modeling & Valuation Analyst), in progress."},
       "open": [["path"]]},
      {"id": "stack", "t": {"es": "Stack técnico", "en": "Tech stack"},
       "keys": ["stack", "lenguajes de programacion", "programming languages", "tecnologias", "technologies", "herramientas", "tools", "programa en", "code in"],
       "a": {"es": "Python, R, SQL, VBA y LaTeX en el día a día: pipelines, motores de valoración y automatizaciones. TypeScript para herramientas web como WHOOP Lab. También Power BI, Calypso (Nasdaq) y econometría bayesiana. Este sitio está hecho en HTML, CSS y JavaScript sin frameworks.",
             "en": "Python, R, SQL, VBA and LaTeX day to day: pipelines, valuation engines and automations. TypeScript for web tools such as WHOOP Lab. Also Power BI, Calypso (Nasdaq) and Bayesian econometrics. This site is plain HTML, CSS and JavaScript, no frameworks."},
       "open": [["path"]]},
      {"id": "interests", "t": {"es": "Intereses de investigación", "en": "Research interests"},
       "keys": ["intereses", "interests", "areas de investigacion", "research interests", "le interesa", "interested in"],
       "a": {"es": "Econometría de series de tiempo y bayesiana, pronóstico de inflación y política monetaria en mercados emergentes, microeconometría aplicada, decisiones financieras, teoría de juegos, educación, economía del desarrollo, M&A, valoración corporativa y mercados de capital privado.",
             "en": "Time series and Bayesian econometrics, inflation forecasting and monetary policy in emerging markets, applied microeconometrics, financial decision-making, game theory, education, development economics, M&A, corporate valuation and private capital markets."},
       "open": [["research"]]},
      {"id": "writing", "t": {"es": "Escritura en X y Substack", "en": "Writing on X and Substack"},
       "keys": ["substack", "blog", "ensayos", "essays", "escribe sobre", "writes about", "write about", "twitter", "tweets", "tuits"],
       "a": {"es": "Escribe en dos registros. En Substack publica ensayos: usa la economía, la filosofía y las ciencias sociales para cuestionar ideas que se dan por sentadas sobre el individuo y la sociedad; no es un blog técnico de finanzas. En X, como @Stbandido_, publica comentarios más cortos sobre la economía colombiana, como el hilo \"Salario mínimo, informalidad y estructura del ingreso en Colombia\" o el ensayo \"Escribir cuando callar es cómodo\".",
             "en": "Esteban writes in two registers. On Substack, essays that use economics, philosophy and the social sciences to question taken-for-granted ideas about the individual and society; it is not a technical finance blog. On X, as @Stbandido_, shorter commentary on Colombia's economy, such as the thread \"Salario mínimo, informalidad y estructura del ingreso en Colombia\" or the essay \"Escribir cuando callar es cómodo\"."},
       "open": [["notes"]],
       "links": [["Substack", "https://substack.com/@estebanlabastidas"], ["X · @Stbandido_", "https://x.com/Stbandido_"]]},
      {"id": "contact", "t": {"es": "Contacto", "en": "Contact"},
       "keys": ["correo", "email", "mail", "contacto", "contactar", "contact", "escribirle", "write to", "reach him"],
       "a": {"es": "La forma más directa es el correo estebanlabastidasm@javeriana.edu.co (el botón abre Mail con el mensaje listo). También está en LinkedIn y en X como @Stbandido_.",
             "en": "The most direct way is email: estebanlabastidasm@javeriana.edu.co (the button opens Mail with a draft ready). Esteban is also on LinkedIn and on X as @Stbandido_."},
       "open": [["mail"]],
       "links": [["LinkedIn", "https://www.linkedin.com/in/esteban-labastidas-cmsa%C2%AE-8272a019a/"]]},
      {"id": "cv", "t": {"es": "Hoja de vida (CV)", "en": "Résumé (CV)"},
       "keys": ["cv", "curriculum", "resume", "hoja de vida"],
       "a": {"es": "El CV está en PDF. También puedes ver la experiencia y la formación en la app Résumé.",
             "en": "The CV is available as a PDF. You can also browse experience and education in the Résumé app."},
       "open": [["path"]],
       "links": [["CV (PDF)", "assets/docs/CV_Esteban_Labastidas.pdf"]]},
      {"id": "hire", "t": {"es": "Colaborar o contratar", "en": "Collaborate or hire"},
       "keys": ["contratar", "contratarlo", "hire", "hiring", "colaborar", "collaborate", "collaboration", "colaboracion", "freelance", "job offer", "oferta laboral", "trabajar con", "work with"],
       "a": {"es": "Esteban está abierto a colaboraciones de investigación, valoración y M&A. Escríbele contando la idea.",
             "en": "Esteban is open to research, valuation and M&A collaborations. Write with your idea."},
       "open": [["mail"]]},
      {"id": "location", "t": {"es": "Ubicación", "en": "Location"},
       "keys": ["donde vive", "where does he live", "where is he based", "where is he from", "de donde es", "ubicacion", "location", "ciudad", "city"],
       "a": {"es": "Bogotá, Colombia. La foto del escritorio de este sitio es Monserrate.",
             "en": "Bogotá, Colombia. The wallpaper on this site is Monserrate."},
       "open": [["about"]]},
      {"id": "languages", "t": {"es": "Idiomas", "en": "Languages"},
       "keys": ["idiomas", "idioma", "languages", "what languages", "which languages", "speak", "ingles", "english", "bilingue", "bilingual"],
       // TODO(esteban): idiomas y nivel inferidos; confírmalos.
       "a": {"es": "Español (nativo) e inglés (profesional). EL·IA responde en los dos.",
             "en": "Spanish (native) and English (professional). EL·IA answers in both."}},
      {"id": "site", "t": {"es": "Este sitio (estebanOS)", "en": "This site (estebanOS)"},
       "keys": ["este sitio", "esta pagina", "this site", "this website", "estebanos", "pagina web", "macos", "dock", "spotlight"],
       "a": {"es": "Este es estebanOS: el sitio personal de Esteban como un escritorio tipo macOS en el navegador, con ventanas, Dock, Spotlight (⌘K), Terminal y música generativa. En el celular es una pantalla de inicio tipo iOS. La versión anterior sigue en /classic/.",
             "en": "This is estebanOS: Esteban's personal site as a macOS-style desktop in the browser, with windows, a Dock, Spotlight (⌘K), a Terminal and generative music. On a phone it becomes an iOS-style home screen. The previous version lives at /classic/."},
       "how": {"es": "HTML, CSS y JavaScript sin frameworks ni build step; funciona en GitHub Pages y abriendo el archivo directamente. Todo el contenido vive en un solo archivo (content.js). Las ventanas se mueven solo con transform para que sea fluido, la música se genera con Web Audio y cada cambio se mide con una herramienta propia en Chrome headless y con axe para accesibilidad.",
               "en": "Plain HTML, CSS and JavaScript, no frameworks or build step; it runs on GitHub Pages and straight from the file. All the content lives in one file (content.js). Windows move with transforms only so it stays smooth, the music is generated with Web Audio, and every change is measured with a custom Chrome-headless tool and with axe for accessibility."},
       "open": [["about"]],
       "links": [["The classic notebook", "classic/"]]},
      {"id": "elia", "t": {"es": "Qué es EL·IA", "en": "What EL·IA is"},
       "keys": ["elia", "el ia", "estebania", "quien eres", "que eres", "who are you", "what are you", "chatbot", "bot", "red neuronal", "neural network"],
       "a": {"es": "Soy EL·IA (o Estebania), una red neuronal pequeña que entrenó Esteban para responder sobre su trabajo. No soy un LLM ni consulto ninguna API: reconozco unas 50 preguntas y, si no estoy segura, te ofrezco escribirle a Esteban en vez de inventar.",
             "en": "I'm EL·IA (or Estebania), a small neural network Esteban trained to answer questions about Esteban's work. I'm not an LLM and I don't call any API: I recognize about 50 kinds of questions and, when I'm not sure, I offer to email Esteban instead of making things up."},
       "how": {"es": "Normalizo tu pregunta (minúsculas, sin tildes), la parto en pedazos de 3 a 5 letras y en palabras, y los convierto en 4.096 números con hashing FNV-1a. Una capa oculta de 64 neuronas y un softmax eligen el tema; otra salida decide si preguntas \"cómo\". Los pesos van en 8 bits y todo corre en tu navegador: tu pregunta no sale de aquí.",
               "en": "I normalize your question (lowercase, no accents), split it into 3- to 5-letter pieces and words, and turn them into 4,096 numbers with FNV-1a hashing. A 64-neuron hidden layer and a softmax pick the topic; another output decides whether you're asking \"how\". The weights are 8-bit and everything runs in your browser: your question never leaves this page."}},
      /* "latest" no tiene texto fijo: la app arma la respuesta con las 3 primeras entradas de "chron". */
      {"id": "latest", "t": {"es": "Lo más reciente", "en": "Latest news"},
       "keys": ["latest", "novedades", "lo ultimo", "lo mas reciente", "recently", "ultimamente", "what s new", "whats new", "que hay de nuevo", "latest news", "recent news", "recent updates"], "dynamic": "chron",
       "open": [["activity"]]},
      {"id": "plates", "t": {"es": "Láminas (visualizaciones)", "en": "Plates (visualizations)"},
       "keys": ["plates", "laminas", "lamina", "visualizaciones", "visualizations", "mapas", "maps", "canopy", "dosel", "alumbrado", "pobreza multidimensional"],
       "a": {"es": "En Photos hay cuatro láminas de visualización de datos: víctimas de delitos y alumbrado público en Bogotá, pobreza multidimensional y el corredor del metro, altura del dosel urbano, y la distribución del PIB entre los departamentos de Colombia.",
             "en": "Photos holds four data-visualization plates: crime victims and public lighting in Bogotá, multidimensional poverty and the metro corridor, urban canopy height, and GDP distribution across Colombia's departments."},
       "open": [["photos"]]},
      {"id": "kaggle", "t": {"es": "Kaggle", "en": "Kaggle"},
       "keys": ["kaggle"],
       "a": {"es": "Esteban tiene perfil en Kaggle como elabastidas.",
             "en": "Esteban is on Kaggle as elabastidas."},
       "links": [["Kaggle", "https://www.kaggle.com/elabastidas"]]},
      {"id": "list_papers", "t": {"es": "Todos los papers", "en": "All papers"},
       "keys": ["todos los papers", "all papers", "all the papers", "lista de papers", "que papers", "what papers", "which papers", "cuantos papers", "how many papers", "publicaciones", "publications", "todas las investigaciones"],
       "a": {"es": "Hay ocho papers: uno en revisión en Emerging Markets Review (pronóstico de inflación y parsimonia), uno en SSRN (alerta temprana híbrida de inflación), uno publicado (coca y rendimiento académico), varios working papers (sesgo mediático, Born This Way, desigualdad espacial en Bogotá) y dos en curso (riesgo bancario y LLMs en pronóstico macro). Además hay cuatro investigaciones en diseño.",
             "en": "There are eight papers: one under review at Emerging Markets Review (inflation forecasting and parsimony), one on SSRN (hybrid inflation early warning), one published (coca and academic performance), several working papers (media bias, Born This Way, spatial inequality in Bogotá) and two in progress (banking risk and LLMs in macro forecasting). Four more studies are in design."},
       "open": [["research"]]},
      {"id": "list_projects", "t": {"es": "Todos los proyectos", "en": "All projects"},
       "keys": ["todos los proyectos", "all projects", "all the projects", "que proyectos", "what projects", "which projects", "cuantos proyectos", "how many projects", "lista de proyectos"],
       "a": {"es": "Catorce proyectos en tres grupos: mercados (SA-CCR, Calypso, dashboards de JPMorgan, ABI, andina, active-equity-desk), sistemas de investigación (pronóstico de inflación, alerta temprana multiagente, sesgo mediático, PGN, Ceteris Paribus) y código abierto (pulso, Patrion, WHOOP Lab).",
             "en": "Fourteen projects in three groups: markets (SA-CCR, Calypso, JPMorgan dashboards, ABI, andina, active-equity-desk), research systems (inflation forecasting, multi-agent early warning, media bias, PGN, Ceteris Paribus) and open source (pulso, Patrion, WHOOP Lab)."},
       "open": [["projects"]]},
      {"id": "greeting", "t": {"es": "Saludo", "en": "Greeting"},
       "a": {"es": "¡Hola! Soy EL·IA. Pregúntame por los proyectos, los papers o la trayectoria de Esteban.",
             "en": "Hi! I'm EL·IA. Ask me about Esteban's projects, papers or career."}},
      {"id": "goodbye", "t": {"es": "Despedida", "en": "Goodbye"},
       "a": {"es": "¡Hasta luego! Si quieres seguir la conversación con Esteban, el correo está en Mail.",
             "en": "Bye! If you want to keep the conversation going with Esteban, the email is in Mail."}},
      {"id": "thanks", "t": {"es": "Agradecimiento", "en": "Thanks"},
       "a": {"es": "Con gusto. ¿Algo más sobre los proyectos o los papers?",
             "en": "You're welcome. Anything else about the projects or the papers?"}},

      /* ── fuera de alcance: no tiene respuesta propia; la app ofrece escribirle a Esteban ── */
      {"id": "out_of_scope", "t": {"es": "Fuera de alcance", "en": "Out of scope"}}
    ]
  }

};

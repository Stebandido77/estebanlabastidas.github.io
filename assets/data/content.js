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
      "b": "Open-source Python library for single-line access to Colombia’s <em>Gran Encuesta Integrada de Hogares</em> (GEIH) — DANE’s monthly household survey covering 2006 to the present. Handles download, parsing, and cross-epoch harmonization across the 2022 methodological redesign, including the GEIH Empalme series. Built under a multi-agent architect/builder/curator workflow. Release candidate <code>v1.0.0-rc1</code> available on <a class=\"project__link\" href=\"https://test.pypi.org/project/pulso/\" rel=\"noopener\" target=\"_blank\">TestPyPI ↗</a> · <a class=\"project__link\" href=\"https://github.com/Stebandido77/pulso\" rel=\"noopener\" target=\"_blank\">github.com/Stebandido77/pulso ↗</a>"
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
      "tags": "EDUCATION · MICROECONOMICS · INTERACTIVE · OPEN SOURCE",
      "b": "An interactive platform to learn microeconomics, econometrics and macro, built on Varian and Wooldridge. Its market game simulates many agents setting prices that converge to equilibrium, with supply and demand shocks, taxes and price controls. <a class=\"project__link\" href=\"https://ceteris-paribus-pearl.vercel.app/\" rel=\"noopener\" target=\"_blank\">Open the platform ↗</a> · <a class=\"project__link\" href=\"https://github.com/Stebandido77/ceteris-paribus\" rel=\"noopener\" target=\"_blank\">github.com/Stebandido77/ceteris-paribus ↗</a>"
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
      "b": "A local dashboard to analyze the official WHOOP data export, including localized (Spanish) headers. Built to be published as an open-source repository."
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
      "b": "Released <a href=\"https://github.com/Stebandido77/pulso\" rel=\"noopener\" target=\"_blank\"><em>pulso</em></a> <code>v1.0.0-rc1</code> on <a href=\"https://test.pypi.org/project/pulso/\" rel=\"noopener\" target=\"_blank\">TestPyPI</a> — an open-source Python library for loading and harmonizing GEIH microdata from Colombia’s DANE across the 2022 methodological redesign. Stable PyPI release in progress."
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
  "projectCategories": {"01": "markets", "02": "markets", "03": "research", "04": "research", "05": "markets", "06": "research", "07": "oss", "08": "oss", "09": "markets", "10": "markets", "11": "oss", "12": "markets", "13": "research", "14": "oss"},

  /* Favoritos de Safari (Links): [nombre, url, glifo, color]. */
  "favorites": [
    ["SSRN · Early-warning paper", "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6625578", "S", "#1e4e8c"],
    ["Ceteris Paribus", "https://ceteris-paribus-pearl.vercel.app/", "c.p.", "#3e5a48"],
    ["pulso on GitHub", "https://github.com/Stebandido77/pulso", "py", "#2b2b2b"],
    ["pulso on TestPyPI", "https://test.pypi.org/project/pulso/", "Pi", "#3775a9"],
    ["GitHub", "https://github.com/Stebandido77", "GH", "#222"],
    ["LinkedIn", "https://www.linkedin.com/in/esteban-labastidas-cmsa%C2%AE-8272a019a/", "in", "#0a66c2"],
    ["X · @Stbandido_", "https://x.com/Stbandido_", "X", "#000"],
    ["Kaggle", "https://www.kaggle.com/elabastidas", "k", "#20beff"],
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
    "x": "https://x.com/Stbandido_"
  },

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
  }
};

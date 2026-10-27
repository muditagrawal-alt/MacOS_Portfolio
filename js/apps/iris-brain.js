/* ==========================================================================
   Iris knowledge engine — retrieval-grounded answers with citations
   --------------------------------------------------------------------------
   A small RAG pipeline that runs entirely in the browser:

     1. INDEX   Every fact this site already holds becomes a passage:
                PROFILE_DATA (bio, education, each experience bullet),
                the Finder filesystem (projects, skills), Notes, the Photos
                certificates and the Trash post-mortems — plus a glossary of
                the technical terms those passages use.
     2. RETRIEVE  BM25 over those passages, with light stemming and a
                synonym map ("job" → experience, "cv" → computer vision …).
     3. ANSWER  Intent-specific templates fill in ONLY retrieved facts, and
                every answer carries the passages it came from as sources.
                Below a relevance threshold Iris says it doesn't know rather
                than guess — the scope guardrail from the roadmap.

   If APP_CONFIG.IRIS_ENDPOINT is set, the same retrieved passages are sent
   to the hosted model as grounding context (see api/iris.js).
   ========================================================================== */

(function () {
    const STOP = new Set(('a an the of to in on for and or is are was were be been being it its this that these those ' +
        'what who whom which how why when where does do did doing has have had having can could would should will may might ' +
        'i me my you your he him his she her they them their we us our about tell show give list explain describe please ' +
        'any some much many more most there here with into from by at as so than then also just only very really ' +
        'mudit agrawal mudits agrawals iris thing things know').split(' '));

    const SYNONYMS = {
        job: ['experience', 'intern'], jobs: ['experience', 'intern'], work: ['experience', 'project'], worked: ['experience', 'intern'],
        career: ['experience', 'intern'], internship: ['intern'], internships: ['intern'], company: ['experience'],
        school: ['education', 'school'], college: ['education', 'university'], university: ['education', 'university'],
        degree: ['education', 'b.tech'], study: ['education'], studied: ['education'], gpa: ['cgpa'], grades: ['cgpa'],
        ml: ['machine', 'learning'], ai: ['ai', 'artificial', 'intelligence'], llms: ['llm'],
        rag: ['rag', 'retrieval'], vision: ['vision', 'computer'], detection: ['detection', 'yolo'],
        built: ['project'], build: ['project'], made: ['project'], create: ['project'], created: ['project'], apps: ['project', 'app'],
        defence: ['defense'], navy: ['navy', 'wesee', 'naval'], military: ['defense', 'navy'],
        speech: ['speech', 'voice', 'audio'], voice: ['voice', 'speech', 'audio'], video: ['video', 'clipping'],
        database: ['database', 'postgresql'], databases: ['database', 'postgresql'], languages: ['programming', 'language']
    };

    function stem(w) {
        if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
        if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
        if (w.length > 4 && w.endsWith('ed') && !w.endsWith('eed')) return w.slice(0, -2);
        if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1);
        return w;
    }

    function tokenize(text, expand) {
        const words = String(text || '').toLowerCase()
            .replace(/[’']/g, '')
            .split(/[^a-z0-9.+#-]+/)
            .flatMap(w => w.split(/[/.](?=[a-z])/))
            .map(w => w.replace(/^[.\-]+|[.\-]+$/g, ''))
            .filter(w => w.length > 1 && !STOP.has(w));
        const out = [];
        words.forEach(w => {
            out.push(stem(w));
            if (expand && SYNONYMS[w]) SYNONYMS[w].forEach(s => out.push(stem(s)));
        });
        return out;
    }

    /* ── Glossary: plain, accurate definitions of terms the portfolio uses ── */
    const GLOSSARY = [
        { term: 'RAG', match: /\b(rag|retrieval[- ]augmented( generation)?)\b/i, find: ['rag', 'retrieval'], def: 'Retrieval-augmented generation: before answering, the system retrieves relevant passages from a document store and gives them to the language model, so answers are grounded in real sources instead of the model’s memory.' },
        { term: 'LLM', match: /\b(llms?|large language models?)\b/i, find: ['llm', 'mistral', 'gemma', 'qwen'], def: 'A large language model: a transformer trained on large text corpora to predict the next token, used for chat, summarisation, extraction and code.' },
        { term: 'VLM', match: /\b(vlms?|vision[- ]language models?)\b/i, find: ['vlm', 'vision-language', 'qwen3-vl'], def: 'A vision-language model takes images and text together — for example, reading a photo of a business card and returning structured fields.' },
        { term: 'SLAM', match: /\bslam\b/i, find: ['slam', 'point', 'trajectory'], def: 'Simultaneous localisation and mapping: estimating a camera’s path while reconstructing the scene around it — here, a sparse 3D point cloud from a single RGB camera.' },
        { term: 'YOLO', match: /\byolo(v?\d+)?\b/i, find: ['yolo', 'yolov8', 'yolo11m', 'yolov26m'], def: 'You Only Look Once: a family of single-stage, real-time object detectors that predict boxes and classes in one pass over the image.' },
        { term: 'BM25', match: /\bbm25\b/i, find: ['bm25'], def: 'A classic keyword-ranking function that scores documents by how often a term appears and how rare it is across the collection. (It is also what ranks the passages I answer from.)' },
        { term: 'pgvector', match: /\bpgvector\b/i, find: ['pgvector'], def: 'A PostgreSQL extension that stores embeddings and runs vector similarity search inside Postgres.' },
        { term: 'Text-to-SQL', match: /\btext[- ]to[- ]sql\b/i, find: ['text-to-sql', 'sql'], def: 'Translating a natural-language question into a SQL query over a known database schema.' },
        { term: 'Hybrid search', match: /\bhybrid (search|retrieval|rag)\b/i, find: ['hybrid', 'bm25', 'pgvector'], def: 'Combining keyword retrieval (like BM25) with vector retrieval (embeddings), so both exact terms and meaning are matched.' },
        { term: 'RAGAS', match: /\bragas\b/i, find: ['ragas'], def: 'An evaluation framework for RAG pipelines that scores faithfulness, answer relevance and context precision/recall.' },
        { term: 'TruLens', match: /\btrulens\b/i, find: ['trulens'], def: 'An open-source toolkit for evaluating and tracing LLM applications with feedback functions such as groundedness and relevance.' },
        { term: 'INT8 quantization', match: /\b(int8|quanti[sz]ation|quanti[sz]ed)\b/i, find: ['int8', 'quantiz', 'intel'], def: 'Storing a model’s weights and activations as 8-bit integers instead of 32-bit floats, cutting memory and latency for a small accuracy cost.' },
        { term: 'Recall@10', match: /\brecall@?\s?10\b/i, find: ['recall@10'], def: 'The share of relevant items that appear in the top 10 retrieved results — a standard retrieval metric.' },
        { term: 'mAP', match: /\bmap@?0?\.?5?\b|\bmean average precision\b/i, find: ['map@0.5', 'map'], def: 'Mean average precision, the standard accuracy metric for object detectors; mAP@0.5 counts a detection as correct when its box overlaps the truth by at least 50%.' },
        { term: 'OCR', match: /\bocr\b/i, find: ['ocr'], def: 'Optical character recognition: extracting text from images and scanned documents.' },
        { term: 'ETL', match: /\betl\b/i, find: ['etl', 'airflow', 'spark'], def: 'Extract, transform, load: pipelines that pull data from sources, clean and reshape it, and load it into a store.' },
        { term: 'Airflow', match: /\bairflow\b/i, find: ['airflow'], def: 'Apache Airflow orchestrates data pipelines as scheduled, monitored DAGs of tasks.' },
        { term: 'Spark', match: /\b(apache )?spark\b|\bpyspark\b/i, find: ['spark', 'pyspark'], def: 'Apache Spark is a distributed engine for large-scale data processing.' },
        { term: 'Embeddings', match: /\bembeddings?\b/i, find: ['embedding', 'bge-m3', 'nomic'], def: 'Dense vectors that represent the meaning of text or images, so similar items sit close together and can be found by similarity search.' },
        { term: 'BLIP', match: /\bblip\b/i, find: ['blip'], def: 'A vision-language model family for image captioning and visual question answering.' },
        { term: 'CLIP', match: /\bclip\b(?! ?ping)/i, find: ['clip'], def: 'OpenAI’s contrastive image–text model, which embeds images and text in a shared space.' },
        { term: 'Whisper', match: /\bwhisper\b/i, find: ['whisper', 'faster-whisper'], def: 'OpenAI’s speech-recognition model, robust across languages and accents.' },
        { term: 'Wav2Lip', match: /\bwav2lip\b/i, find: ['wav2lip'], def: 'A model that generates lip movements on a face video to match a given audio track.' },
        { term: 'NLLB', match: /\bnllb(-200)?\b/i, find: ['nllb', 'nllb-200', 'fb-nllb'], def: 'Meta’s “No Language Left Behind” machine-translation model covering about 200 languages.' },
        { term: 'FAISS', match: /\bfaiss\b/i, find: ['faiss'], def: 'A library for fast nearest-neighbour search over large sets of vectors.' },
        { term: 'LangChain', match: /\blangchain\b/i, find: ['langchain'], def: 'A framework for composing LLM calls, tools and retrieval into applications.' },
        { term: 'LoRA', match: /\blora\b|\bfine[- ]?tun/i, find: ['lora', 'fine-tune'], def: 'LoRA (low-rank adaptation) fine-tunes a large model by training small low-rank matrices instead of every weight.' },
        { term: 'Agents', match: /\bagent(ic|s)?\b/i, find: ['agent', 'agentic'], def: 'Agentic systems let a language model plan and call tools — search, APIs, code — in a loop to finish multi-step tasks.' },
        { term: 'Deepfakes', match: /\bdeep ?fakes?\b/i, find: ['deepfake', 'forensics'], def: 'Synthetic media in which a person’s face or voice is generated or swapped by a neural network; detection looks for the artefacts that process leaves.' }
    ];

    /* ── Index ──────────────────────────────────────────────────────────── */
    let passages = null;
    let projects = [];
    let idf = {};
    let avgLen = 1;

    function shortOrg(org) {
        return String(org || '').split(' (')[0].replace(/ Pvt\. Ltd\./, '');
    }

    function buildIndex() {
        const P = window.PROFILE_DATA || {};
        const fs = (typeof FS_ITEMS === 'object') ? FS_ITEMS : {};
        const list = [];
        const add = (title, text, source, extra = {}) => list.push({ title, text, source, ...extra });

        add('About', `${P.name} is an ${P.tagline}. ${P.bio}`, { label: 'About', open: () => openWelcome() }, { kind: 'about' });

        const e = P.education || {};
        add('Education', `${e.degree} at ${e.university} (${e.years}), CGPA ${e.cgpa}. Class 12 at Navy Children School, New Delhi (2023) with 74%. Class 10 at Navy Children School, Mumbai (2021) with 89%.`,
            { label: 'Education', open: () => openFinderPane('education') }, { kind: 'education' });

        (P.experience || []).forEach(x => {
            const org = shortOrg(x.org);
            const src = { label: `Experience · ${org}`, open: () => openFinderPane('experience') };
            add(`${x.role} — ${org}`, `${x.role} at ${x.org}, ${x.dates}.`, src, { kind: 'experience', org, exp: x });
            (x.bullets || []).forEach(b => add(`${org}`, `At ${org}, ${x.role}: ${b}.`, src, { kind: 'experience-bullet', org, exp: x }));
        });

        const projIds = (typeof AAKASH_STYLE_FS === 'object' && AAKASH_STYLE_FS['projects-folder']) ? AAKASH_STYLE_FS['projects-folder'].items : [];
        const corpus = window.PORTFOLIO_CORPUS || [];
        projects = projIds.map(id => fs[id]).filter(Boolean).map(it => {
            const pv = it.preview || {};
            const c = corpus.find(x => x.type === 'Project' && (x.url === it.link || normaliseName(x.title).includes(normaliseName(it.name)) || normaliseName(it.name).includes(normaliseName(x.title))));
            return {
                id: it.id, name: it.name, link: it.link, live: Boolean(it.link && !/github\.com/.test(it.link)),
                summary: pv.subtitle || it.kind, desc: (pv.desc || '').split('\n')[0],
                text: `${pv.title || it.name} — ${pv.subtitle || ''}. ${pv.desc || ''} ${c ? c.text + ' ' + (c.tags || []).join(' ') : ''}`
            };
        });
        projects.forEach(pr => add(`Project · ${pr.name}`, pr.text, {
            label: `Project · ${pr.name}`, open: () => pr.link ? openExternal(pr.link) : openFinderPane('projects')
        }, { kind: 'project', project: pr }));

        Object.values(fs).filter(it => /^skill-/.test(it.id)).forEach(it => {
            const pv = it.preview || {};
            add(`Skills · ${pv.title}`, `${pv.title} (${pv.subtitle}): ${pv.desc}.`, { label: 'Skills', open: () => openFinderPane('skills') }, { kind: 'skills', skillList: pv.desc });
        });

        if (typeof notesData === 'object') {
            Object.entries(notesData).filter(([, n]) => !n.isUserNote).forEach(([id, n]) => {
                const tmp = document.createElement('div');
                tmp.innerHTML = n.body;
                add(`Notes · ${n.title}`, `${n.title}. ${tmp.textContent.replace(/\s+/g, ' ')}`, {
                    label: `Notes · ${n.title}`, open: () => { openWindow('notes-window'); selectNote(id); }
                }, { kind: 'note' });
            });
        }

        ((window.PHOTO_LIBRARY || {}).certificates || { items: [] }).items.forEach(c => {
            add('Certificates', `${c.title} certificate from ${c.issuer}.`, { label: 'Photos · Certificates', open: () => openWindow('photos-window') }, { kind: 'cert' });
        });

        (window.TRASH_ITEMS || []).forEach(t => {
            add(`Trash · ${t.name}`, `${t.name} (${t.kind}): ${t.reason}`, { label: 'Trash · cut ideas', open: () => openWindow('trash-window') }, { kind: 'trash' });
        });

        const c = P.contact || {};
        add('Contact', `Email ${c.email}. Phone ${c.phone}. LinkedIn ${c.linkedin}. GitHub ${c.github}.`, { label: 'Contact', open: () => { openWindow('mail-window'); openMailCompose(); } }, { kind: 'contact' });

        list.forEach(p => { p.tokens = tokenize(p.text); p.len = p.tokens.length; });
        const df = {};
        list.forEach(p => new Set(p.tokens).forEach(t => { df[t] = (df[t] || 0) + 1; }));
        const N = list.length;
        idf = {};
        Object.entries(df).forEach(([t, n]) => { idf[t] = Math.log(1 + (N - n + 0.5) / (n + 0.5)); });
        avgLen = list.reduce((s, p) => s + p.len, 0) / Math.max(1, N);
        passages = list;
    }

    function normaliseName(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

    function retrieve(query, { k = 5, kinds = null } = {}) {
        if (!passages) buildIndex();
        const q = tokenize(query, true);
        if (!q.length) return [];
        const K1 = 1.4, B = 0.72;
        return passages
            .filter(p => !kinds || kinds.includes(p.kind))
            .map(p => {
                let score = 0;
                q.forEach(t => {
                    const f = p.tokens.reduce((n, x) => n + (x === t ? 1 : 0), 0);
                    if (!f) return;
                    score += (idf[t] || 0) * (f * (K1 + 1)) / (f + K1 * (1 - B + B * p.len / avgLen));
                });
                return { p, score };
            })
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, k);
    }

    function uniqSources(list) {
        const seen = new Set();
        return list.filter(s => s && !seen.has(s.label) && seen.add(s.label));
    }

    /* ── Answer composition ─────────────────────────────────────────────── */
    function answer(text, sources, extra = {}) {
        return { text, sources: uniqSources(sources || []), ...extra };
    }

    function respond(rawQuestion) {
        if (!passages) buildIndex();
        const P = window.PROFILE_DATA || {};
        const q = String(rawQuestion || '').trim();
        const ql = q.toLowerCase();
        const exp = P.experience || [];
        const src = (kind) => passages.filter(p => p.kind === kind).map(p => p.source);

        if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b[!. ]*$/i.test(ql)) {
            return answer(`Hi! I can answer questions about ${P.name ? P.name.split(' ')[0] : 'Mudit'}’s experience, projects and skills — or open things for you. Try “What has he built?”`, []);
        }
        if (/^(thanks|thank you|thx|cool|nice|great|awesome|ok(ay)?)\b/i.test(ql)) {
            return answer('Any time. Anything else you’d like to know?', []);
        }
        if (/\b(who|what) are you\b|\bwhat can you do\b|\bhow do you work\b/i.test(ql)) {
            return answer('I’m Iris. I answer from this portfolio’s own content — every reply lists the sources it came from — and I can operate the Mac: “open Terminal”, “play music”, “download the résumé”. If something isn’t in the portfolio, I’ll say so rather than guess.', []);
        }

        // Who is he / introduce
        if (/\b(who is|who's|about|introduce|summary|summari[sz]e|tell me about)\b.*\b(him|mudit|he|yourself)\b|^who is\b|^about (him|mudit)\b|\bbackground\b/i.test(ql) && !/\b(carnot|zee|wesee|navy)\b/i.test(ql)) {
            const now = exp[0];
            return answer(`**${P.name}** is an ${P.tagline}. ${P.bio}${now ? `\n\nRight now he’s **${now.role}** at ${shortOrg(now.org)} (${now.dates}).` : ''}`,
                [...src('about'), ...src('experience').slice(0, 1)]);
        }

        // Why hire / strengths
        if (/\b(why (should|would) (i|we|you) hire|why hire|reasons? to hire|strengths?|what makes him|stand out|good fit|best at)\b/i.test(ql)) {
            const lines = exp.slice(0, 3).map(x => `• **${shortOrg(x.org)}** — ${(x.bullets || [x.role])[0]}.`);
            const live = projects.filter(p => p.live).length;
            lines.push(`• **${projects.length} projects** in the portfolio, ${live} of them deployed and usable right now.`);
            return answer(`The evidence, straight from his record:\n${lines.join('\n')}`, [...src('experience').slice(0, 3), { label: 'Projects', open: () => openFinderPane('projects') }]);
        }

        // Contact
        if (/\b(contact|reach|email|e-mail|phone|call|linkedin|get in touch|hire him)\b/i.test(ql) && !/\b(project|built)\b/i.test(ql)) {
            const c = P.contact || {};
            return answer(`You can reach ${P.name.split(' ')[0]} at **${c.email}** or ${c.phone}. LinkedIn: [profile](${c.linkedin}).`, src('contact'), {
                card: { title: 'Write to Mudit', subtitle: c.email, icon: 'fas fa-paper-plane', btnText: 'Compose', action: "closeIris(); openWindow('mail-window'); openMailCompose();" }
            });
        }

        // Education
        if (/\b(education|degree|university|college|cgpa|gpa|grades?|school|studying|b\.?tech|graduat)/i.test(ql)) {
            const e = P.education || {};
            return answer(`He’s doing a **${e.degree}** at **${e.university}** (${e.years}) with a **${e.cgpa} CGPA**. Before that: Class 12 at Navy Children School, New Delhi (74%) and Class 10 at Navy Children School, Mumbai (89%).`, src('education'));
        }

        // A specific employer
        const orgMatch = ql.match(/\b(carnot|zee|wesee|navy|naval)\b/i);
        if (orgMatch) {
            const key = orgMatch[1].toLowerCase().replace('naval', 'navy');
            const x = exp.find(e => e.org.toLowerCase().includes(key === 'navy' ? 'navy' : key));
            if (x) {
                return answer(`**${x.role}**, ${x.org} (${x.dates}):\n${(x.bullets || []).map(b => `• ${b}.`).join('\n')}`,
                    passages.filter(p => p.exp === x).map(p => p.source));
            }
        }

        // Experience overview
        if (/\b(experience|intern(ship)?s?|jobs?|worked|work history|career|employ)/i.test(ql) && !/\bwith\b/i.test(ql)) {
            return answer(`${exp.length} internships, most recent first:\n${exp.map(x => `• **${x.role}**, ${shortOrg(x.org)} — ${x.dates}`).join('\n')}\n\nAsk about any of them for details.`, src('experience'));
        }

        // Glossary: "what is RAG", "explain SLAM"
        const isDefinitional = /\b(what('s| is| are| does)|explain|define|meaning of|stand for)\b/i.test(ql);
        const g = GLOSSARY.find(x => x.match.test(ql));
        if (g && (isDefinitional || ql.split(/\s+/).length <= 3)) {
            const uses = passages.filter(p => !['trash', 'cert', 'note'].includes(p.kind) && g.find.some(f => p.text.toLowerCase().includes(f)))
                .sort((a, b) => (a.kind === 'project' ? 0 : 1) - (b.kind === 'project' ? 0 : 1)).slice(0, 3);
            const where = uses.length ? `\n\n**Where Mudit uses it:**\n${uses.map(u => `• ${u.title.replace(/^Project · /, '')} — ${trimSentence(u.text.replace(/^At [^,]+, [^:]+: /, ''), 120)}`).join('\n')}` : '';
            return answer(`**${g.term}** — ${g.def}${where}`, [{ label: 'Glossary' }, ...uses.map(u => u.source)]);
        }

        // Skills: "does he know PyTorch?", "tech stack"
        const skillAsk = ql.match(/\b(?:know|knows|use|uses|used|familiar with|experience (?:with|in)|work(?:ed)? with|proficient in|skilled in)\s+([a-z0-9.+#\- ]{2,30})/i);
        const skillPassages = passages.filter(p => p.kind === 'skills');
        if (skillAsk) {
            const term = skillAsk[1].replace(/\b(and|or|the|a|an)\b.*$/i, '').trim().replace(/[?.!]+$/, '');
            const t = term.toLowerCase();
            const inSkills = skillPassages.filter(p => p.skillList.toLowerCase().split(/,\s*/).some(s => s.includes(t) || (t.length > 2 && t.includes(s.replace(/\s*\(.*\)/, '')))));
            const used = retrieve(term, { k: 3, kinds: ['project', 'experience-bullet'] }).filter(r => r.p.text.toLowerCase().includes(t));
            if (inSkills.length || used.length) {
                const where = inSkills.map(p => p.title.replace('Skills · ', '')).join(', ');
                const evidence = used.map(r => `• ${r.p.title.replace(/^Project · /, '')} — ${trimSentence(r.p.text.replace(/^At [^,]+, [^:]+: /, ''), 110)}`).join('\n');
                return answer(`Yes — **${term}**${where ? ` is listed under *${where}*` : ''}.${evidence ? `\n\n${evidence}` : ''}`, [...inSkills.map(p => p.source), ...used.map(r => r.p.source)]);
            }
            return answer(`I don’t see **${term}** in his listed skills or projects. His core stack is Python, PyTorch, LangChain, OpenCV and FastAPI — ask “what’s his tech stack?” for the full list.`, skillPassages.map(p => p.source));
        }
        if (/\b(skills?|tech(nology)? stack|stack|tools|frameworks|languages)\b/i.test(ql)) {
            return answer(skillPassages.map(p => `• **${p.title.replace('Skills · ', '')}:** ${trimSentence(p.skillList, 160)}`).join('\n'), skillPassages.map(p => p.source));
        }

        // A named project
        const named = projects.find(pr => {
            const n = normaliseName(pr.name).replace(/ai$/, '');
            return n.length > 2 && normaliseName(ql).includes(n);
        }) || projects.find(pr => (pr.id === 'proj-deepfake' && /\bveritas|deepfake|fake news\b/i.test(ql)) || (pr.id === 'proj-vlm' && /\bvlm|lead|business card\b/i.test(ql)) || (pr.id === 'proj-sword' && /\bsword|weapon\b/i.test(ql)));
        if (named) {
            return answer(`**${named.name}** — ${named.summary}.\n${named.desc}${named.link ? `\n\n${named.live ? 'Try it live' : 'Source'}: [${named.link.replace(/^https?:\/\//, '')}](${named.link})` : ''}`,
                passages.filter(p => p.project === named).map(p => p.source), named.link ? {
                    card: { title: named.name, subtitle: named.live ? 'Live — opens in a new tab' : 'Opens on GitHub', icon: 'fas fa-cube', btnText: 'Open', action: `openExternal('${named.link.replace(/'/g, '')}')` }
                } : {});
        }

        // Projects, optionally by topic
        if (/\b(projects?|built|build|made|portfolio|apps?|work on|working on)\b/i.test(ql)) {
            const topic = ql.replace(/\b(what|which|has|have|he|mudit|built|build|made|projects?|show|me|list|his|the|any|are|is|of|on|in|about|does|do|did|work|working|portfolio|apps?|with|using|use|uses)\b/g, ' ').trim();
            let list = projects;
            if (topic.length > 1) {
                const hits = retrieve(topic, { k: 6, kinds: ['project'] });
                if (hits.length) list = hits.map(h => h.p.project);
            }
            list = list.slice().sort((a, b) => Number(b.live) - Number(a.live)).slice(0, 5);
            return answer(`${topic.length > 1 ? `Projects matching “${topic}”` : 'Featured projects'} (live ones first):\n${list.map(p => `• **${p.name}**${p.live ? ' · live' : ''} — ${p.summary}`).join('\n')}\n\nAsk about any one for details.`,
                list.map(p => passages.find(x => x.project === p).source));
        }

        // Lessons / failures
        if (/\b(fail|failure|mistake|lesson|learned|cut|abandon|didn'?t work)/i.test(ql)) {
            const t = passages.filter(p => p.kind === 'trash').slice(0, 3);
            return answer(`A few ideas he cut, and why:\n${t.map(p => `• ${trimSentence(p.text, 150)}`).join('\n')}`, t.map(p => p.source));
        }

        // General retrieval
        const hits = retrieve(q, { k: 4 });
        if (hits.length && hits[0].score >= 2.2) {
            const top = hits.filter(h => h.score >= hits[0].score * 0.45).slice(0, 3);
            return answer(`Here’s what the portfolio says:\n${top.map(h => `• ${trimSentence(h.p.text, 170)}`).join('\n')}`, top.map(h => h.p.source));
        }

        // Out of scope — refuse rather than invent.
        return answer(`I only know what’s in this portfolio, and I couldn’t find anything about that. Try asking about his **experience**, **projects**, **skills** or **education** — or say “open Terminal”.`, [], { outOfScope: true });
    }

    function trimSentence(text, max) {
        const t = String(text || '').replace(/\s+/g, ' ').trim();
        if (t.length <= max) return t;
        const cut = t.slice(0, max);
        return cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).replace(/[,;:.\s]+$/, '') + '…';
    }

    /** Top passages as plain text, for grounding a hosted model. */
    function contextFor(query, k = 6) {
        return retrieve(query, { k }).map(r => `[${r.p.source.label}] ${r.p.text}`);
    }

    window.IrisBrain = { respond, retrieve, contextFor, rebuild: buildIndex };
})();

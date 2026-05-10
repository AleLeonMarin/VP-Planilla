const fs = require('fs');
const path = require('path');

/**
 * GSD Sync Validator
 * Ensures consistency between STATE.md, ROADMAP.md, and REQUIREMENTS.md
 */

const PLANNING_DIR = path.join(process.cwd(), '.planning');
const REQS_PATH = path.join(PLANNING_DIR, 'REQUIREMENTS.md');
const ROADMAP_PATH = path.join(PLANNING_DIR, 'ROADMAP.md');
const STATE_PATH = path.join(PLANNING_DIR, 'STATE.md');

function parseTraceability() {
    const content = fs.readFileSync(REQS_PATH, 'utf8');
    const mapping = {};
    // Match table rows: | REQ-ID | ... | Phase X |
    const regex = /\| ([\w-]+) \| [^|]+ \| Phase (\d+) \|/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const reqId = match[1];
        const phaseId = match[2];
        if (!mapping[phaseId]) mapping[phaseId] = [];
        mapping[phaseId].push(reqId);
    }
    return mapping;
}

function getCompletedPhases() {
    const content = fs.readFileSync(STATE_PATH, 'utf8');
    const completed = new Set();
    // Match Phase X Completed or Status: Phase X Completed
    const regex = /(?:Phase|Fase) (\d+) (?:Completed|complete|COMPLETED)/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
        completed.add(match[1]);
    }
    return completed;
}

function getCheckedRequirements() {
    const content = fs.readFileSync(REQS_PATH, 'utf8');
    const checked = new Set();
    // Match - [x] **REQ-ID**
    const regex = /- \[x\] \*\*([\w-]+)\*\*/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        checked.add(match[1]);
    }
    return checked;
}

function validate() {
    console.log('🔍 Iniciando validación de integridad de planificación...');
    
    const trace = parseTraceability();
    const completedPhases = getCompletedPhases();
    const checkedReqs = getCheckedRequirements();
    
    let errors = 0;
    
    for (const phaseId in trace) {
        if (completedPhases.has(phaseId)) {
            const reqs = trace[phaseId];
            reqs.forEach(reqId => {
                if (!checkedReqs.has(reqId)) {
                    console.error(`❌ ERROR: Fase ${phaseId} marcada como COMPLETADA pero Requisito ${reqId} está PENDIENTE en REQUIREMENTS.md`);
                    errors++;
                }
            });
        }
    }

    if (errors === 0) {
        console.log('✅ Integridad verificada: Todos los requisitos están sincronizados con las fases completadas.');
        process.exit(0);
    } else {
        console.log(`\n⚠️ Se encontraron ${errors} inconsistencias. Por favor, sincroniza REQUIREMENTS.md antes de continuar.`);
        process.exit(1);
    }
}

try {
    validate();
} catch (error) {
    console.error('Falla crítica en el validador:', error.message);
    process.exit(1);
}

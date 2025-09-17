const fs = require('fs');
const path = require('path');
const { stdin: input, stdout: output } = require('process');
const readline = require('readline/promises');

const DATA_FILE = path.join(__dirname, 'students.json');

let students = [];

function loadFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      students = JSON.parse(raw);
    } else {
      students = [];
    }
  } catch (err) {
    console.error('Falha ao carregar arquivo:', err.message);
    students = [];
  }
}

function saveToFile() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2), 'utf8');
  } catch (err) {
    console.error('Falha ao salvar arquivo:', err.message);
  }
}

// --- Validações ---
function validateName(name) {
  return typeof name === 'string' && name.trim().length > 0;
}

function validateAge(age) {
  const n = Number(age);
  return Number.isInteger(n) && n > 0;
}

function validateGrade(g) {
  const n = Number(g);
  return !Number.isNaN(n) && n >= 0 && n <= 10;
}

// --- Funções (pelo menos 5) ---

// 1) Criar estudante (adiciona ao array)
function addStudent(name, age, grades) {
  const student = {
    id: generateId(),
    name: name.trim(),
    age: Number(age),
    grades: grades.map(g => Number(g)),
  };
  students.push(student);
  saveToFile();
  return student;
}

// 2) Gerar ID simples incremental
function generateId() {
  const lastId = students.length > 0 ? students[students.length - 1].id : 0;
  return parseInt(lastId) + 1;
  
}

// 3) Listar estudantes (exibe resumo)
function listStudents() {
  if (students.length === 0) {
    console.log('\nNenhum estudante cadastrado.');
    return;
  }
  console.log('\nLista de estudantes:');
  students.forEach((s, idx) => {
    console.log(`${idx + 1}. ${s.name} (idade: ${s.age}) - média: ${average(s.grades).toFixed(2)}`);
  });
}

// 4) Buscar por nome (parcial, case-insensitive)
function findStudentsByName(query) {
  const q = query.trim().toLowerCase();
  return students.filter(s => s.name.toLowerCase().includes(q));
}

// 5) Calcular média individual (usa reduce)
function average(grades) {
  if (!Array.isArray(grades) || grades.length === 0) return 0;
  const sum = grades.reduce((acc, g) => acc + Number(g), 0); // reduce
  return sum / grades.length;
}

// 6) Média geral da turma
function classAverage() {
  if (students.length === 0) return 0;
  // map + reduce
  const avgs = students.map(s => average(s.grades));
  const total = avgs.reduce((acc, a) => acc + a, 0);
  return total / avgs.length;
}

// 7) Estudante com maior média
function topStudent() {
  if (students.length === 0) return null;
  return students.reduce((best, s) => {
    return (best === null || average(s.grades) > average(best.grades)) ? s : best;
  }, null);
}

// 8) Relatórios (aprovados, recuperação, reprovados)
function approvedStudents() {
  return students.filter(s => average(s.grades) >= 7.0);
}

function recoveryStudents() {
  return students.filter(s => {
    const m = average(s.grades);
    return m >= 5.0 && m < 7.0;
  });
}

function failedStudents() {
  return students.filter(s => average(s.grades) < 5.0);
}

// 9) Editar estudante
function editStudent(id, newData) {
  const idx = students.findIndex(s => s.id === id);
  if (idx === -1) return false;
  students[idx] = { ...students[idx], ...newData };
  saveToFile();
  return true;
}

// 10) Remover estudante
function removeStudent(id) {
  const before = students.length;
  students = students.filter(s => s.id !== id);
  if (students.length < before) {
    saveToFile();
    return true;
  }
  return false;
}

// --- Utilitários de exibição ---
function printStudentDetail(s) {
  console.log('\n--- Detalhes ---');
  console.log(`ID: ${s.id}`);
  console.log(`Nome: ${s.name}`);
  console.log(`Idade: ${s.age}`);
  console.log(`Notas: ${s.grades.join(', ')}`);
  console.log(`Média: ${average(s.grades).toFixed(2)}`);
}

function printList(title, list) {
  console.log(`\n${title} (${list.length}):`);
  if (list.length === 0) console.log('  — nenhum');
  list.forEach((s, i) => console.log(`  ${i + 1}. ${s.name} — média: ${average(s.grades).toFixed(2)}`));
}

// --- Interface de terminal (menu) ---
async function mainMenu() {
  const rl = readline.createInterface({ input, output });
  while (true) {
    console.log('\n=== GERENCIADOR DE ESTUDANTES ===');
    console.log('1) Cadastrar estudante');
    console.log('2) Listar estudantes');
    console.log('3) Buscar por nome');
    console.log('4) Média geral da turma');
    console.log('5) Estudante com maior média');
    console.log('6) Relatórios (aprovados/recuperação/reprovados)');
    console.log('7) Editar estudante');
    console.log('8) Remover estudante');
    console.log('9) Exportar JSON (forçar salvar)');
    console.log('0) Sair');

    const choice = (await rl.question('\nEscolha uma opção: ')).trim();

    switch (choice) {
      case '1':
        await handleAdd(rl);
        break;
      case '2':
        listStudents();
        break;
      case '3':
        await handleSearch(rl);
        break;
      case '4':
        console.log(`\nMédia geral da turma: ${classAverage().toFixed(2)}`);
        break;
      case '5':
        const top = topStudent();
        if (!top) console.log('\nNenhum estudante cadastrado.');
        else printStudentDetail(top);
        break;
      case '6':
        printList('Aprovados (>=7.0)', approvedStudents());
        printList('Recuperação (5.0–6.9)', recoveryStudents());
        printList('Reprovados (<5.0)', failedStudents());
        break;
      case '7':
        await handleEdit(rl);
        break;
      case '8':
        await handleRemove(rl);
        break;
      case '9':
        saveToFile();
        console.log('\nArquivo salvo em', DATA_FILE);
        break;
      case '0':
        console.log('\nSaindo...');
        rl.close();
        return;
      default:
        console.log('\nOpção inválida. Tente novamente.');
    }
  }
}

// --- Handlers que usam readline ---
async function handleAdd(rl) {
  const name = await rl.question('Nome: ');
  if (!validateName(name)) return console.log('Nome inválido. Cadastro cancelado.');

  const age = await rl.question('Idade: ');
  if (!validateAge(age)) return console.log('Idade inválida. Cadastro cancelado.');

  const gradesRaw = await rl.question('Notas (separadas por vírgula, ex: 8,7.5,6): ');
  const grades = gradesRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
  if (grades.length === 0) return console.log('Nenhuma nota informada. Cadastro cancelado.');
  for (const g of grades) {
    if (!validateGrade(g)) return console.log(`Nota inválida (${g}). Cadastro cancelado.`);
  }

  const student = addStudent(name, age, grades);
  console.log('\nEstudante cadastrado com sucesso:');
  printStudentDetail(student);
}

async function handleSearch(rl) {
  const q = await rl.question('Nome (busca parcial): ');
  if (!validateName(q)) return console.log('Busca vazia.');
  const found = findStudentsByName(q);
  if (found.length === 0) console.log('\nNenhum estudante encontrado.');
  else found.forEach((s, i) => console.log(`${i + 1}. ${s.name} — média: ${average(s.grades).toFixed(2)} (ID: ${s.id})`));
}

async function handleEdit(rl) {
  const id = await rl.question('ID do estudante a editar: ');
  const student = students.find(s => s.id === id.trim());
  if (!student) return console.log('ID não encontrado.');

  console.log('Deixe em branco para manter o valor atual.');
  const name = await rl.question(`Nome [${student.name}]: `);
  const age = await rl.question(`Idade [${student.age}]: `);
  const gradesRaw = await rl.question(`Notas (vírgula) [${student.grades.join(',')}]: `);

  const newData = {};
  if (name.trim().length > 0) {
    if (!validateName(name)) return console.log('Nome inválido. Edição cancelada.');
    newData.name = name.trim();
  }
  if (age.trim().length > 0) {
    if (!validateAge(age)) return console.log('Idade inválida. Edição cancelada.');
    newData.age = Number(age);
  }
  if (gradesRaw.trim().length > 0) {
    const grades = gradesRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
    for (const g of grades) if (!validateGrade(g)) return console.log(`Nota inválida (${g}). Edição cancelada.`);
    newData.grades = grades.map(Number);
  }

  const ok = editStudent(student.id, newData);
  console.log(ok ? '\nEstudante atualizado.' : '\nFalha ao atualizar.');
}

async function handleRemove(rl) {
  const id = await rl.question('ID do estudante a remover: ');
  const ok = removeStudent(id.trim());
  console.log(ok ? 'Estudante removido.' : 'ID não encontrado.');
}

// --- Inicialização ---
function ensureDataFileExists() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

loadFromFile();
ensureDataFileExists();

// Rodar o menu principal
mainMenu().catch(err => {
  console.error('Erro na interface:', err.message);
});

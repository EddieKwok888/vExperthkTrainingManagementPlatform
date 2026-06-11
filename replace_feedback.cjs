const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'components/FeedbackTemplateTab.tsx',
  'components/FeedbackTab.tsx'
];

const basePath = 'c:\\\\GoogleProject\\\\vExperthkTrainingManagementPlatform\\\\src\\\\features\\\\admin';

const replacements = [
  { from: 'Email Address 電郵', to: 'Email Address' },
  { from: 'Company Name 公司名稱', to: 'Company Name' },
  { from: 'Content of the course 內容', to: 'Course Content' },
  { from: 'Level of the course 程度', to: 'Course Level' },
  { from: 'Course material usefulness 教材', to: 'Course material usefulness' },
  { from: 'Teaching aids, facilities & environment 設施', to: 'Teaching aids, facilities & environment' },
  { from: 'Adequacy of practice/exercise 練習', to: 'Adequacy of practice/exercise' },
  { from: 'Job applicability / usefulness 實用', to: 'Job applicability / usefulness' },
  { from: 'OVERALL 整體評分', to: 'OVERALL' },
  { from: 'Knowledge of the subject 科目的認識', to: 'Knowledge of the subject' },
  { from: 'Presentation & communication skills 表達技巧', to: 'Presentation & communication skills' },
  { from: 'Individual attention given 對學生的照顧', to: 'Individual attention given' },
  { from: 'ANY OTHER COMMENTS 其他意見：', to: 'ANY OTHER COMMENTS:' },
  { from: "label: '正面'", to: "label: 'Positive'" },
  { from: "label: '需要關注'", to: "label: 'Needs Attention'" },
  { from: "label: '建議'", to: "label: 'Suggestion'" }
];

filesToProcess.forEach(file => {
  const filePath = path.join(basePath, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  replacements.forEach(r => {
    content = content.split(r.from).join(r.to);
  });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Processed ' + file);
});

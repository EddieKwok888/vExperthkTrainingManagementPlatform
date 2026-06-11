import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Plus, Trash2, GripVertical, Save, Info, Eye } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '../../../components/ui/dialog';

export const DEFAULT_TEMPLATE = {
  title: 'Course Evaluation Questionnaire',
  description: 'This evaluation form is designed to gather valuable feedback on the course content, delivery, and overall experience. Your input is crucial for us to improve and tailor our training to meet your needs. Please rate each aspect honestly and provide any additional comments that could help enhance the learning experience.',
  fields: [
    { id: 'studentName', type: 'text', label: 'Student Name', required: true },
    { id: 'studentEmail', type: 'text', label: 'Email Address', required: true },
    { id: 'companyName', type: 'text', label: 'Company Name', required: true },
    { id: 'contentScore', type: 'rating', label: 'Course Content', required: true, part: 'course' },
    { id: 'levelScore', type: 'rating', label: 'Course Level', required: true, part: 'course' },
    { id: 'materialsScore', type: 'rating', label: 'Course material usefulness', required: true, part: 'course' },
    { id: 'facilitiesScore', type: 'rating', label: 'Teaching aids, facilities & environment', required: true, part: 'course' },
    { id: 'practiceScore', type: 'rating', label: 'Adequacy of practice/exercise', required: true, part: 'course' },
    { id: 'jobApplicabilityScore', type: 'rating', label: 'Job applicability / usefulness', required: true, part: 'course' },
    { id: 'overallCourseScore', type: 'rating', label: 'OVERALL', required: true, part: 'course' },
    { id: 'tutorKnowledgeScore', type: 'rating', label: 'Knowledge of the subject', required: true, part: 'tutor' },
    { id: 'tutorOrganizationScore', type: 'rating', label: 'Organization & Logic', required: true, part: 'tutor' },
    { id: 'tutorPresentationScore', type: 'rating', label: 'Presentation & communication skills', required: true, part: 'tutor' },
    { id: 'tutorAttentionScore', type: 'rating', label: 'Individual attention given', required: true, part: 'tutor' },
    { id: 'overallTutorScore', type: 'rating', label: 'OVERALL', required: true, part: 'tutor' },
    { id: 'comment', type: 'textarea', label: 'ANY OTHER COMMENTS:', required: false }
  ]
};

export function FeedbackTemplateTab() {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const docRef = doc(db, 'settings', 'feedback_template');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setTemplate(snap.data() as any);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'feedback_template'), template);
      toast.success('Feedback template saved successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const addField = (type: 'text' | 'textarea' | 'rating') => {
    const newField = {
      id: 'field_' + Date.now(),
      type,
      label: 'New ' + type + ' field',
      required: false,
      part: type === 'rating' ? 'course' : undefined
    };
    setTemplate({ ...template, fields: [...template.fields, newField] });
  };

  const updateField = (index: number, updates: any) => {
    const newFields = [...template.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setTemplate({ ...template, fields: newFields });
  };

  const removeField = (index: number) => {
    const newFields = [...template.fields];
    newFields.splice(index, 1);
    setTemplate({ ...template, fields: newFields });
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading form builder...</div>;

  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-start justify-between pb-4 border-b border-slate-50">
        <div>
          <CardTitle className="text-xl font-black text-slate-800 tracking-tight">Course Feedback</CardTitle>
          <CardDescription className="text-xs font-medium text-slate-500 mt-1">
            Customize the fields and questions that students will see when evaluating confirmed courses.
          </CardDescription>
        </div>
        <div className="flex gap-2">
           <Dialog>
             <DialogTrigger render={<Button variant="outline" className="shadow-md h-9 text-[10px] font-bold uppercase tracking-wider border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800" />}>
                 <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview Form
             </DialogTrigger>
             <DialogContent className="max-w-[100vw] h-[100dvh] max-h-[100dvh] overflow-y-auto w-full gap-0 border-none rounded-none shadow-none p-0 bg-slate-50">
               <div className="absolute right-4 top-4 z-50">
                   <DialogTrigger render={<Button variant="outline" className="bg-white/80 backdrop-blur-sm shadow-md" />}>
                       Close Preview
                   </DialogTrigger>
               </div>
               <div className="min-h-screen bg-slate-50 relative pt-12">
                <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500 font-sans">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{template.title || 'Course Evaluation Questionnaire'}</h1>
                    <p className="text-slate-500 text-sm mt-2">{template.description}</p>
                  </div>

                  {/* Required Course Metadata Block */}
                  <Card className="border-t-4 border-t-indigo-600 shadow-md">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                      <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500">GENERAL INFORMATION</CardTitle>
                      <CardDescription className="text-xs font-medium">Auto-filled data regarding the current session</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course Name</label>
                           <Input value={'Sample Course 101'} readOnly className="bg-slate-50 font-bold text-slate-700 border-slate-200" />
                         </div>
                         <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instructor</label>
                           <Input value={'John Doe'} readOnly className="bg-slate-50 font-bold text-slate-700 border-slate-200" />
                         </div>
                         <div className="space-y-2 md:col-span-2">
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                           <Input value={'2023-10-24'} readOnly className="bg-slate-50 font-bold text-slate-700 border-slate-200" />
                         </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dynamic Fields */}
                  <Card className="shadow-md border-none">
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                         {template.fields.map((f: any) => {
                             if (f.type === 'rating') {
                                 return (
                                     <div key={f.id} className="p-6 md:p-8 bg-white hover:bg-slate-50/50 transition-colors">
                                       <p className="text-sm font-medium text-slate-800 mb-3">{f.label} {f.required && <span className="text-red-500">*</span>}</p>
                                       <div className="flex flex-wrap gap-6 sm:gap-12 pl-2">
                                         {['5', '4', '3', '2', '1'].map(grade => (
                                           <label key={grade} className="flex items-center gap-2 cursor-pointer transition-colors hover:text-indigo-600">
                                             <input type="radio" className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer" readOnly name={"preview-"+f.id} value={grade} />
                                             <span className="text-sm font-bold text-slate-700">{grade}</span>
                                           </label>
                                         ))}
                                       </div>
                                     </div>
                                 );
                             } else if (f.type === 'textarea') {
                                 return (
                                     <div key={f.id} className="p-6 md:p-8 bg-white hover:bg-slate-50/50 transition-colors">
                                        <Label className="text-sm font-medium text-slate-800 block mb-2">{f.label} {f.required && <span className="text-red-500">*</span>}</Label>
                                        <textarea className="w-full h-24 border border-slate-200 rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none resize-none font-medium text-slate-700 bg-white" readOnly placeholder="Answer goes here..." />
                                     </div>
                                 );
                             } else {
                                 const isReadOnly = ['studentName', 'studentEmail', 'companyName'].includes(f.id);
                                 return (
                                     <div key={f.id} className="p-6 md:p-8 bg-white hover:bg-slate-50/50 transition-colors">
                                        <Label className="text-sm font-medium text-slate-800 block mb-2">{f.label} {f.required && <span className="text-red-500">*</span>}</Label>
                                        <Input className={`w-full h-10 border-slate-200 text-sm font-medium text-slate-700 max-w-sm ${isReadOnly ? 'bg-slate-50 opacity-70 cursor-not-allowed' : 'bg-white'}`} readOnly placeholder="Short response..." />
                                     </div>
                                 );
                             }
                         })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-none border border-slate-200 bg-transparent">
                    <CardContent className="p-6">
                       <label className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors shadow-sm">
                          <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" readOnly checked={true} />
                          <div className="text-sm text-slate-600 leading-relaxed">
                             <p className="font-bold text-slate-800 mb-1">Marketing Consent</p>
                             <p className="font-medium">Kenfil Hong Kong Limited may use my comment for marketing purpose. Please check the box to indicate your consent.</p>
                             <p className="italic mt-2 text-xs text-slate-400">Note: We assure you that your personal information will be kept confidential and will not be shared with any third party.</p>
                          </div>
                       </label>
                       
                       <div className="flex gap-4 pt-6 opacity-60">
                          <Button type="button" variant="outline" disabled className="w-1/3 h-12 text-xs uppercase tracking-wider font-bold shadow-sm">Reset Defaults</Button>
                          <Button disabled className="w-2/3 gap-2 h-12 text-xs uppercase tracking-wider font-bold bg-indigo-600 text-white shadow-md">
                            Submit Evaluation
                          </Button>
                       </div>
                    </CardContent>
                  </Card>
                </div>
               </div>
             </DialogContent>
           </Dialog>
           <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 shadow-md h-9 text-[10px] font-bold uppercase tracking-wider">
             <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? 'Saving...' : 'Save Template'}
           </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-8">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-sm text-indigo-800">
           <Info className="w-5 h-5 flex-shrink-0 text-indigo-500" />
           <div>
              <p className="font-bold mb-1">How it works</p>
              <p className="text-xs text-indigo-700 leading-relaxed">This template defines the feedback form structure. Changes here will immediately apply to all new and existing confirmed courses when students click "Submit Feedback". The analytics dashboard uses the ID mappings (like <code className="bg-white px-1 py-0.5 rounded text-[10px]">overallCourseScore</code>) to generate reports.</p>
           </div>
        </div>

        <div className="space-y-4 max-w-3xl">
          <div>
            <Label className="uppercase text-[10px] font-bold text-slate-500 tracking-wider">Form Title</Label>
            <Input 
              value={template.title}
              onChange={e => setTemplate({...template, title: e.target.value})}
              className="mt-1 font-bold h-10"
            />
          </div>
          <div>
            <Label className="uppercase text-[10px] font-bold text-slate-500 tracking-wider">Form Description</Label>
            <Input 
              value={template.description}
              onChange={e => setTemplate({...template, description: e.target.value})}
              className="mt-1 h-10 text-sm text-slate-600"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
           <div className="flex items-center justify-between mb-4">
              <Label className="uppercase text-[12px] font-black text-slate-800 tracking-tight">Form Fields</Label>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={() => addField('text')} className="text-[10px] font-bold uppercase tracking-wider h-8"><Plus className="w-3 h-3 mr-1" /> Add Text</Button>
                 <Button variant="outline" size="sm" onClick={() => addField('textarea')} className="text-[10px] font-bold uppercase tracking-wider h-8"><Plus className="w-3 h-3 mr-1" /> Add Textarea</Button>
                 <Button variant="outline" size="sm" onClick={() => addField('rating')} className="text-[10px] font-bold uppercase tracking-wider h-8"><Plus className="w-3 h-3 mr-1" /> Add Rating (1-5)</Button>
              </div>
           </div>

           <div className="space-y-3">
             {template.fields.map((field, index) => (
               <div key={index} className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-indigo-200 transition-colors">
                  <div className="mt-2 text-slate-300">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-4">
                     <div className="flex gap-4">
                        <div className="flex-1">
                          <Label className="text-[10px] uppercase font-bold text-slate-400">Field Label (Question)</Label>
                          <Input 
                            value={field.label} 
                            onChange={e => updateField(index, { label: e.target.value })} 
                            className="mt-1 h-9 text-sm font-medium"
                          />
                        </div>
                        <div className="w-32">
                          <Label className="text-[10px] uppercase font-bold text-slate-400">Input Type</Label>
                          <select 
                            value={field.type} 
                            onChange={e => updateField(index, { type: e.target.value })}
                            className="w-full mt-1 h-9 border border-slate-200 rounded-md text-sm px-2 bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                             <option value="text">Short Text</option>
                             <option value="textarea">Paragraph</option>
                             <option value="rating">Rating (1-5)</option>
                          </select>
                        </div>
                     </div>
                     <div className="flex flex-wrap gap-6 items-center">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                            checked={field.required}
                            onChange={e => updateField(index, { required: e.target.checked })}
                          />
                          Required Field
                        </label>
                        {field.type === 'rating' && (
                          <div className="flex items-center gap-2">
                            <Label className="text-[10px] uppercase font-bold text-slate-400">Report Category:</Label>
                            <select 
                              value={field.part || 'course'} 
                              onChange={e => updateField(index, { part: e.target.value })}
                              className="h-7 border border-slate-200 rounded text-[10px] uppercase font-bold tracking-wider px-2 bg-indigo-50 text-indigo-700 outline-none"
                            >
                               <option value="course">Course Metric</option>
                               <option value="tutor">Instructor Metric</option>
                            </select>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                           <Label className="text-[10px] uppercase font-bold text-slate-400">Data ID:</Label>
                           <Input 
                             value={field.id}
                             onChange={e => updateField(index, { id: e.target.value })}
                             className="h-7 w-48 text-[10px] font-mono bg-slate-50"
                           />
                        </div>
                        {['studentName', 'studentEmail', 'companyName', 'overallCourseScore', 'overallTutorScore'].includes(field.id) && (
                          <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-amber-200">System Required</span>
                        )}
                     </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeField(index)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 h-auto" title="Remove Field">
                    <Trash2 className="w-4 h-4" />
                  </Button>
               </div>
             ))}
           </div>
        </div>
      </CardContent>
    </Card>
  );
}

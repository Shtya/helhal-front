// 'use client';

// import React, { useMemo, useRef, useState } from 'react';
// import { OwnerPanel } from '@/components/pages/profile/overview/OwnerPanel';
// import { AboutCard } from '@/components/pages/profile/overview/AboutCard';
// import { ProfileCard } from '@/components/pages/profile/overview/ProfileCard';

// export default function Overview({}) {
//   const [profile, setProfile] = useState({
//     name: 'Temur K',
//     email: 'figkhubulava@hotmail.com',
//     country: 'Georgia',
//     memberSince: 'Mar 2025',
//     avatarUrl: '',
//   });

//   const [about, setAbout] = useState({
//     description: 'Lorem ipsum dolor sit amet... etc',
//     languages: ['English - Fluent'],
//     skills: ['Ux–Ui Designer'],
//     education: ['Ux–Ui Designer'],
//     certification: ['Ux–Ui Designer'],
//   });

//   const [editing, setEditing] = useState({ profile: false, description: false });
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalTarget, setModalTarget] = useState('skills');
//   const [newItemText, setNewItemText] = useState('');
//   const [previewOpen, setPreviewOpen] = useState(false);

//   const reviews = useMemo(
//     () => [
//       { author: 'Temur K', text: 'No reviews', stars: 5 },
//       { author: 'Temur K', text: 'No reviews', stars: 5 },
//       { author: 'Temur K', text: 'No reviews', stars: 5 },
//       { author: 'Temur K', text: 'No reviews', stars: 5 },
//       { author: 'Temur K', text: 'No reviews', stars: 5 },
//     ],
//     [],
//   );

//   const fileRef = useRef(null);
//   const onPickAvatar = () => fileRef.current?.click();
//   const onAvatarChange = e => {
//     const file = e.target.files && e.target.files[0];
//     if (!file) return;
//     const url = URL.createObjectURL(file);
//     setProfile(p => ({ ...p, avatarUrl: url }));
//   };

//   const openAdd = target => {
//     setModalTarget(target);
//     setNewItemText('');
//     setModalOpen(true);
//   };
//   const submitAdd = () => {
//     if (!newItemText.trim()) return;
//     setAbout(prev => ({
//       ...prev,
//       [modalTarget]: [...prev[modalTarget], newItemText.trim()],
//     }));
//     setModalOpen(false);
//   };

//   const removeAt = (key, idx) => {
//     setAbout(prev => ({
//       ...prev,
//       [key]: prev[key].filter((_, i) => i !== idx),
//     }));
//   };

//   return (
//     <div className='container !mt-8 '>
//       <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8'>
//         <div className='lg:col-span-4 space-y-6'>
//           <ProfileCard profile={profile} editing={editing.profile} setEditing={v => setEditing(e => ({ ...e, profile: v }))} onPickAvatar={onPickAvatar} fileRef={fileRef} onAvatarChange={onAvatarChange} onChange={(field, val) => setProfile(p => ({ ...p, [field]: val }))} onPreview={() => setPreviewOpen(true)} />
//           <AboutCard about={about} editingDesc={editing.description} onToggleEdit={() => setEditing(e => ({ ...e, description: !e.description }))} onChangeDesc={val => setAbout(a => ({ ...a, description: val }))} onOpenAdd={openAdd} onRemove={removeAt} />
//         </div>
//         <div className='lg:col-span-8 lg:sticky top-[120px] h-fit '>
//           <OwnerPanel reviews={reviews} />
//         </div>

//         {modalOpen && (
//           <Modal onClose={() => setModalOpen(false)} title={`Add to ${modalTarget}`}>
//             <input value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitAdd()} />
//             <button onClick={submitAdd}>Add</button>
//           </Modal>
//         )}

//         {previewOpen && (
//           <Modal onClose={() => setPreviewOpen(false)} title='Profile preview'>
//             <div>{profile.name}</div>
//           </Modal>
//         )}
//       </div>
//     </div>
//   );
// }









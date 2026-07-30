import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Icon from '../common/Icon';
import { useFetchSettings, useUpdateSettings } from '../../services/settings';

type CreateDomainTagsProps = {
   closeModal: Function,
}

const CreateDomainTags = ({ closeModal }: CreateDomainTagsProps) => {
   const [tagInput, setTagInput] = useState('');
   const [draftTags, setDraftTags] = useState<string[]>([]);
   const { data: appSettingsData } = useFetchSettings();
   const { mutate: updateSettings, isLoading } = useUpdateSettings(() => {
      closeModal(false);
   });

   const existingTags: string[] = appSettingsData?.settings?.domain_tags || [];
   const appSettings: SettingsType = appSettingsData?.settings || {};

   const addDraftTag = () => {
      const next = tagInput.trim();
      if (!next) return;
      const lower = next.toLowerCase();
      if (existingTags.some((t) => t.toLowerCase() === lower) || draftTags.some((t) => t.toLowerCase() === lower)) {
         toast('Tag already exists', { icon: '⚠️' });
         setTagInput('');
         return;
      }
      setDraftTags((prev) => [...prev, next]);
      setTagInput('');
   };

   const saveTags = () => {
      if (draftTags.length === 0) {
         toast('Add at least one tag', { icon: '⚠️' });
         return;
      }
      const merged = Array.from(new Set([...existingTags, ...draftTags]));
      updateSettings({ ...appSettings, domain_tags: merged });
   };

   return (
      <Modal closeModal={() => closeModal(false)} title="Create Domain Tags">
         <div className="text-sm">
            <p className="text-gray-500 mb-3">Type a tag and press Enter to add more. Then save.</p>
            <input
               className="w-full border rounded border-gray-200 py-3 px-4 outline-none focus:border-indigo-300"
               placeholder="e.g. client → Enter → local → Enter"
               value={tagInput}
               autoFocus={true}
               onChange={(e) => setTagInput(e.target.value)}
               onKeyDown={(e) => {
                  if (e.code === 'Enter') {
                     e.preventDefault();
                     addDraftTag();
                  }
               }}
            />
            {(draftTags.length > 0 || existingTags.length > 0) && (
               <div className="mt-4">
                  {draftTags.length > 0 && (
                     <>
                        <h4 className="text-xs font-semibold text-gray-500 mb-2">New</h4>
                        <ul className="mb-4">
                           {draftTags.map((tag) => (
                              <li key={tag} className="inline-flex items-center bg-indigo-50 text-indigo-700 py-1 px-3 border rounded mr-2 mb-2">
                                 <Icon type="tags" size={13} classes="mr-1" />
                                 {tag}
                                 <button
                                    type="button"
                                    className="ml-2 hover:text-red-600"
                                    onClick={() => setDraftTags((prev) => prev.filter((t) => t !== tag))}
                                 >
                                    <Icon type="close" size={12} />
                                 </button>
                              </li>
                           ))}
                        </ul>
                     </>
                  )}
                  {existingTags.length > 0 && (
                     <>
                        <h4 className="text-xs font-semibold text-gray-500 mb-2">Existing</h4>
                        <ul>
                           {existingTags.map((tag) => (
                              <li key={tag} className="inline-flex items-center bg-slate-50 text-slate-500 py-1 px-3 border rounded mr-2 mb-2">
                                 <Icon type="tags" size={13} classes="mr-1" />
                                 {tag}
                              </li>
                           ))}
                        </ul>
                     </>
                  )}
               </div>
            )}
            <div className="mt-6 text-right text-sm font-semibold">
               <button className="py-2 px-5 rounded cursor-pointer bg-indigo-50 text-slate-500 mr-3" onClick={() => closeModal(false)}>
                  Cancel
               </button>
               <button
                  className="py-2 px-5 rounded cursor-pointer bg-blue-700 text-white"
                  onClick={() => !isLoading && saveTags()}
               >
                  {isLoading ? 'Saving...' : `Save${draftTags.length ? ` (${draftTags.length})` : ''}`}
               </button>
            </div>
         </div>
      </Modal>
   );
};

export default CreateDomainTags;

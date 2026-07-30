import { useMemo, useState } from 'react';
import Modal from '../common/Modal';
import Icon from '../common/Icon';
import { useUpdateDomainTags } from '../../services/domains';

type AttachDomainTagsProps = {
   domain: DomainType,
   availableTags: string[],
   closeModal: Function,
}

const AttachDomainTags = ({ domain, availableTags, closeModal }: AttachDomainTagsProps) => {
   const initialTags = useMemo(() => domain.tags || [], [domain.tags]);
   const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
   const { mutate: updateTags, isLoading } = useUpdateDomainTags(() => closeModal(false));

   const toggleTag = (tag: string) => {
      setSelectedTags((prev) => (
         prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      ));
   };

   return (
      <Modal closeModal={() => closeModal(false)} title={`Attach Tags — ${domain.domain}`}>
         <div className="text-sm my-2">
            {availableTags.length === 0 ? (
               <div className="text-center text-gray-500 py-8">
                  No tags created yet. Create tags first from the Domains page.
               </div>
            ) : (
               <ul className="max-h-72 overflow-auto styled-scrollbar">
                  {availableTags.map((tag) => {
                     const active = selectedTags.includes(tag);
                     return (
                        <li key={tag}>
                           <button
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded mb-1 border transition
                                 ${active
                                 ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                 : 'bg-white border-transparent hover:bg-slate-50 text-slate-600'}`}
                           >
                              <span className="flex items-center">
                                 <Icon type="tags" size={14} classes="mr-2" />
                                 {tag}
                              </span>
                              <span className={`w-4 h-4 rounded border flex items-center justify-center
                                 ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 text-transparent'}`}>
                                 <Icon type="check" size={10} color={active ? '#fff' : 'transparent'} />
                              </span>
                           </button>
                        </li>
                     );
                  })}
               </ul>
            )}
            <div className="mt-6 text-right text-sm font-semibold">
               <button className="py-2 px-5 rounded cursor-pointer bg-indigo-50 text-slate-500 mr-3" onClick={() => closeModal(false)}>
                  Cancel
               </button>
               <button
                  className="py-2 px-5 rounded cursor-pointer bg-blue-700 text-white disabled:opacity-50"
                  disabled={availableTags.length === 0 || isLoading}
                  onClick={() => updateTags({ domain, tags: selectedTags })}
               >
                  {isLoading ? 'Saving...' : 'Save Tags'}
               </button>
            </div>
         </div>
      </Modal>
   );
};

export default AttachDomainTags;

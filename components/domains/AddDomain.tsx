import React, { useState } from 'react';
import Modal from '../common/Modal';
import Icon from '../common/Icon';
import { useAddDomain } from '../../services/domains';
import { isValidUrl } from '../../utils/client/validators';

type AddDomainProps = {
   domains: DomainType[],
   availableTags?: string[],
   closeModal: Function
}

const AddDomain = ({ closeModal, domains = [], availableTags = [] }: AddDomainProps) => {
   const [newDomain, setNewDomain] = useState<string>('');
   const [newDomainError, setNewDomainError] = useState('');
   const [selectedTags, setSelectedTags] = useState<string[]>([]);
   const { mutate: addMutate, isLoading: isAdding } = useAddDomain(() => closeModal());

   const toggleTag = (tag: string) => {
      setSelectedTags((prev) => (
         prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      ));
   };

   const addDomain = () => {
      setNewDomainError('');
      const existingDomains = domains.map((d) => d.domain);
      const insertedURLs = newDomain.split('\n');
      const domainsTobeAdded:string[] = [];
      const invalidDomains:string[] = [];
      insertedURLs.forEach((url) => {
        const theURL = url.trim();
        if (isValidUrl(theURL)) {
         const domURL = new URL(theURL);
         const isDomain = domURL.pathname === '/';
         if (isDomain && !existingDomains.includes(domURL.host)) {
            domainsTobeAdded.push(domURL.host);
         }
         if (!isDomain && !existingDomains.includes(domURL.href)) {
            const cleanedURL = domURL.href.replace('https://', '').replace('http://', '').replace(/^\/+|\/+$/g, '');
            domainsTobeAdded.push(cleanedURL);
         }
        } else {
         invalidDomains.push(theURL);
        }
      });
      if (invalidDomains.length > 0) {
         setNewDomainError(`Please Insert Valid Website URL. ${invalidDomains.length > 1 ? `Invalid URLs: ${invalidDomains.join(', ')}` : ''}`);
      } else if (domainsTobeAdded.length > 0) {
         addMutate({ domains: domainsTobeAdded, tags: selectedTags });
      }
   };

   const handleDomainInput = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
      if (e.currentTarget.value === '' && newDomainError) { setNewDomainError(''); }
      setNewDomain(e.currentTarget.value);
   };

   return (
      <Modal closeModal={() => { closeModal(false); }} title={'Add New Domain'}>
         <div data-testid="adddomain_modal">
            <h4 className='text-sm mt-4 pb-2'>Website URL(s)</h4>
            <textarea
               className={`w-full h-40 border rounded border-gray-200 p-4 outline-none
                focus:border-indigo-300 ${newDomainError ? ' border-red-400 focus:border-red-400' : ''}`}
               placeholder={'Type or Paste URLs here. Insert Each URL in a New line. eg: \nhttps://mysite.com/ \nhttps://anothersite.com/ '}
               value={newDomain}
               autoFocus={true}
               onChange={handleDomainInput}>
            </textarea>
            {newDomainError && <div><span className=' ml-2 block float-right text-red-500 text-xs font-semibold'>{newDomainError}</span></div>}

            {availableTags.length > 0 && (
               <div className="mt-4">
                  <h4 className="text-sm pb-2">Attach Tags</h4>
                  <ul className="flex flex-wrap gap-2">
                     {availableTags.map((tag) => {
                        const active = selectedTags.includes(tag);
                        return (
                           <li key={tag}>
                              <button
                                 type="button"
                                 onClick={() => toggleTag(tag)}
                                 className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded border transition
                                    ${active
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    : 'bg-white border-gray-200 text-slate-500 hover:border-indigo-200'}`}
                              >
                                 <Icon type="tags" size={12} />
                                 {tag}
                              </button>
                           </li>
                        );
                     })}
                  </ul>
               </div>
            )}

            <div className='mt-6 text-right text-sm font-semibold'>
               <button className='py-2 px-5 rounded cursor-pointer bg-indigo-50 text-slate-500 mr-3' onClick={() => closeModal(false)}>Cancel</button>
               <button className='py-2 px-5 rounded cursor-pointer bg-blue-700 text-white' onClick={() => !isAdding && addDomain() }>
                   {isAdding ? 'Adding....' : 'Add Domain'}
               </button>
            </div>
         </div>
      </Modal>
   );
};

export default AddDomain;

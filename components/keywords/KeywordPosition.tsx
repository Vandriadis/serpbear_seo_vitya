import Icon from '../common/Icon';

type KeywordPositionProps = {
   position: number,
   updating?: boolean,
   type?: string,
   resultCount?: number,
}

const KeywordPosition = ({ position = 0, type = '', updating = false, resultCount }:KeywordPositionProps) => {
   if (!updating && position === 0) {
      const label = resultCount ? `>${resultCount}` : '—';
      const title = resultCount
         ? `Not found in top ${resultCount} organic results`
         : 'Not found in SERP';
      return <span className='text-gray-400' title={title}>{label}</span>;
   }
   if (updating && type !== 'sc') {
      return <span title='Updating Keyword Position'><Icon type="loading" /></span>;
   }
   return <>{Math.round(position)}</>;
};

export default KeywordPosition;

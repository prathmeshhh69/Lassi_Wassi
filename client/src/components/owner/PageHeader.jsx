/**
 * PageHeader — section title + optional action button
 */
const PageHeader = ({ title, description, action }) => (
    <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {description && <p className="text-gray-500 text-sm mt-0.5">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
    </div>
);

export default PageHeader;

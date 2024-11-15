// LanguageSelect.js
import React from 'react';

const LanguageSelect = ({ value, onChange }) => {
    return (
        <div>
        <label htmlFor="language-select" className="block text-sm font-medium text-gray-700">
            Select Language
        </label>
        <select
            name="HeadlineAct"
             id="language-select"
             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={value}
            onChange={onChange}
        >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
        </select></div>
        
    );
};

export default LanguageSelect;

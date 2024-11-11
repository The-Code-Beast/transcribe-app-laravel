// LanguageSelect.js
import React from 'react';

const LanguageSelect = ({ value, onChange }) => {
    return (
        <select
            name="HeadlineAct"
            id="HeadlineAct"
            className="mt-2 w-full rounded-lg border-gray-300 text-gray-700 sm:text-sm"
            value={value}
            onChange={onChange}
        >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
        </select>
    );
};

export default LanguageSelect;

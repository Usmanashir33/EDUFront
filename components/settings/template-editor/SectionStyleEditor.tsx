import React from 'react';
import { SectionStyle } from './types';
import { Input } from '../../UI';

interface SectionStyleEditorProps {
    label: string;
    value: SectionStyle;
    onChange: (value: SectionStyle) => void;
    showSpacing?: boolean;
    showBorder?: boolean;
    showBackground?: boolean;
}

export const SectionStyleEditor: React.FC<SectionStyleEditorProps> = ({ 
    label, 
    value, 
    onChange,
    showSpacing = true,
    showBorder = true,
    showBackground = true
}) => {
    const handleChange = (key: keyof SectionStyle, val: string) => {
        onChange({ ...value, [key]: val });
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="font-bold text-sm text-gray-700">{label} Styles</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Font Family</label>
                    <select 
                        value={value.fontFamily}
                        onChange={(e) => handleChange('fontFamily', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-navy-500"
                    >
                        <option value="inherit">Inherit Global</option>
                        <option value="Arial">Arial</option>
                        <option value="'Times New Roman'">Times New Roman</option>
                        <option value="'Courier New'">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Font Size</label>
                    <select 
                        value={value.fontSize}
                        onChange={(e) => handleChange('fontSize', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-navy-500"
                    >
                        <option value="inherit">Inherit Global</option>
                        <option value="0.8em">0.8em (Small)</option>
                        <option value="1em">1em (Normal)</option>
                        <option value="1.1em">1.1em</option>
                        <option value="1.2em">1.2em (Large)</option>
                        <option value="1.5em">1.5em (X-Large)</option>
                        <option value="2em">2em (XX-Large)</option>
                        <option value="8px">8px</option>
                        <option value="10px">10px</option>
                        <option value="12px">12px</option>
                        <option value="14px">14px</option>
                        <option value="16px">16px</option>
                        <option value="18px">18px</option>
                        <option value="20px">20px</option>
                        <option value="24px">24px</option>
                        <option value="28px">28px</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="color" 
                            value={value.color !== 'inherit' ? value.color || '#000000' : '#000000'}
                            onChange={(e) => handleChange('color', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                            disabled={value.color === 'inherit'}
                        />
                        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={value.color === 'inherit'} 
                                onChange={(e) => handleChange('color', e.target.checked ? 'inherit' : '#000000')}
                            />
                            Inherit
                        </label>
                        {value.color !== 'inherit' && <span className="text-xs text-gray-500 uppercase">{value.color}</span>}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Alignment</label>
                    <select 
                        value={value.textAlign}
                        onChange={(e) => handleChange('textAlign', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-navy-500"
                    >
                        <option value="inherit">Inherit</option>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                        <option value="justify">Justify</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Font Weight</label>
                    <select 
                        value={value.fontWeight}
                        onChange={(e) => handleChange('fontWeight', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-navy-500"
                    >
                        <option value="inherit">Inherit</option>
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="thin">Thin</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Font Style</label>
                    <select 
                        value={value.fontStyle}
                        onChange={(e) => handleChange('fontStyle', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-navy-500"
                    >
                        <option value="inherit">Inherit</option>
                        <option value="normal">Normal</option>
                        <option value="italic">Italic</option>
                    </select>
                </div>

                {showSpacing && (
                    <>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Padding</label>
                            <Input 
                                value={value.padding || ''} 
                                onChange={(e) => handleChange('padding', e.target.value)} 
                                placeholder="e.g. 10px 20px" 
                                className="text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Margin</label>
                            <Input 
                                value={value.margin || ''} 
                                onChange={(e) => handleChange('margin', e.target.value)} 
                                placeholder="e.g. 10px 0" 
                                className="text-sm"
                            />
                        </div>
                    </>
                )}

                {showBorder && (
                    <>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Border</label>
                            <Input 
                                value={value.border || ''} 
                                onChange={(e) => handleChange('border', e.target.value)} 
                                placeholder="e.g. 1px solid #ccc" 
                                className="text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Border Radius</label>
                            <Input 
                                value={value.borderRadius || ''} 
                                onChange={(e) => handleChange('borderRadius', e.target.value)} 
                                placeholder="e.g. 4px" 
                                className="text-sm"
                            />
                        </div>
                    </>
                )}

                {showBackground && (
                    <>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Background Color</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    value={value.backgroundColor || '#ffffff'}
                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                />
                                <button 
                                    onClick={() => handleChange('backgroundColor', 'transparent')}
                                    className="text-xs text-blue-500 hover:underline"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Box Shadow</label>
                            <Input 
                                value={value.boxShadow || ''} 
                                onChange={(e) => handleChange('boxShadow', e.target.value)} 
                                placeholder="e.g. 0 4px 6px rgba(0,0,0,0.1)" 
                                className="text-sm"
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

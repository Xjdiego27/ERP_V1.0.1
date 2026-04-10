import { useEffect, useMemo, useRef, useState } from 'react';
import IconoFa from './IconoFa';
import { faTimes, faEgg, faDog, faFaceSmile } from '@fortawesome/free-solid-svg-icons';
import { EMOJI_ARRAY, SHIBA_ARRAY, HATCH_ARRAY, STICKER_TABS } from '../data/stickerCatalog';

const TAB_ICONS = {
    hatch: faEgg,
    shiba: faDog,
    emoji: faFaceSmile,
};

export default function StickerPicker({ onSelectSticker, onSelectEmoji, onClose }) {
    const [tabActiva, setTabActiva] = useState('hatch');
    const rootRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (rootRef.current && !rootRef.current.contains(e.target)) onClose?.();
        }
        function handleEscape(e) {
            if (e.key === 'Escape') onClose?.();
        }
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const grupos = useMemo(() => ({
        hatch: HATCH_ARRAY,
        shiba: SHIBA_ARRAY,
        emoji: EMOJI_ARRAY,
    }), []);

    const items = useMemo(() => grupos[tabActiva] || [], [grupos, tabActiva]);

    function handleSelect(item) {
        if (tabActiva === 'emoji') onSelectEmoji?.(item.img);
        else onSelectSticker?.(item);
    }

    const esShibaTab = tabActiva === 'shiba';
    const esEmojiTab = tabActiva === 'emoji';
    const tabInfo = STICKER_TABS.find(t => t.id === tabActiva);

    return (
        <div className="sticker-picker-retro" ref={rootRef}>

            {/* Header */}
            <div className="sticker-picker-retro-header">
                <div>
                    <strong>Centro de Stickers</strong>
                    <span>{tabInfo?.label}</span>
                </div>
                <button type="button" className="sticker-picker-retro-close" onClick={onClose} title="Cerrar">
                    <IconoFa icono={faTimes} />
                </button>
            </div>

            {/* Cuerpo */}
            <div className="sticker-picker-retro-body">
                {
                    <div className={`sticker-picker-retro-grid${esEmojiTab ? ' emoji-grid' : ''}${esShibaTab ? ' shiba-grid' : ''}`}>
                        {items.map(item => (
                            <button
                                key={item.id}
                                type="button"
                                className={`sticker-picker-retro-item${esEmojiTab ? ' emoji-item' : ''}`}
                                title={item.label}
                                onClick={() => handleSelect(item)}
                            >
                                {esEmojiTab ? (
                                    <span className="sticker-picker-retro-emoji">{item.img}</span>
                                ) : (
                                    <img src={item.img} alt={item.label} loading="lazy" />
                                )}
                            </button>
                        ))}
                    </div>
                }
            </div>

            {/* Tabs */}
            <div className="sticker-picker-retro-tabs">
                {STICKER_TABS.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`sticker-picker-retro-tab${tabActiva === tab.id ? ' active' : ''}`}
                        onClick={() => setTabActiva(tab.id)}
                        title={tab.label}
                    >
                        <IconoFa icono={TAB_ICONS[tab.id]} />
                        <span className="tab-count">{tab.count}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

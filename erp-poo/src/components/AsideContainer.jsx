import '../styles/AsidePanel.css';

export default function AsideContainer({ isOpen, children }) {
  return (
    <aside className={`aside-right-panel ${isOpen ? 'open' : 'closed'}`}>
      {children}
    </aside>
  );
}
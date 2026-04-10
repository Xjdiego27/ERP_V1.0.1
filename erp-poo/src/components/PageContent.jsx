import '../styles/PageContent.css';

export default function PageContent({ children }) {
  return (
    <div className="page-content-wrapper">
      <div className="white-card">
        {children}
      </div>
    </div>
  );
}
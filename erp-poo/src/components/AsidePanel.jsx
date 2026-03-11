import '../styles/AsidePanel.css';
import AsideContainer from './AsideContainer';
import AsideContent from './AsideContent';

export default function AsidePanel({ isOpen, children }) {
  return (
    <AsideContainer isOpen={isOpen}>
      <AsideContent>
        {children}
      </AsideContent>
    </AsideContainer>
  );
}
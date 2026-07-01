import { toPng, toSvg } from 'html-to-image';

const downloadFile = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPng = async (projectName) => {
  const element = document.querySelector('.react-flow');
  if (!element) return;
  try {
    // Hide controls, minimap, and other non-diagram canvas overlays temporary if needed
    // or just capture the container. We can capture it directly.
    const dataUrl = await toPng(element, {
      backgroundColor: '#ffffff',
      style: {
        transform: 'scale(1)',
      },
      quality: 0.95,
      pixelRatio: 2, // Retains high-quality resolution
    });
    downloadFile(dataUrl, `${projectName || 'architecture'}-diagram.png`);
  } catch (error) {
    console.error('Lỗi khi xuất PNG:', error);
    throw error;
  }
};

export const exportToSvg = async (projectName) => {
  const element = document.querySelector('.react-flow');
  if (!element) return;
  try {
    const dataUrl = await toSvg(element, {
      backgroundColor: '#ffffff',
      style: {
        transform: 'scale(1)',
      }
    });
    downloadFile(dataUrl, `${projectName || 'architecture'}-diagram.svg`);
  } catch (error) {
    console.error('Lỗi khi xuất SVG:', error);
    throw error;
  }
};

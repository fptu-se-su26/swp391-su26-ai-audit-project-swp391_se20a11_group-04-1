import React from 'react';
import { TYPE_ICON_MAP } from './EvidenceCard';

/**
 * EvidencePreview — Preview evidence content dựa trên type
 * Mỗi evidence type có cách hiển thị khác nhau
 */
const EvidencePreview = ({ evidence }) => {
  const type = evidence.type || 'DOCUMENT';
  const fileUrl = evidence.fileUrl || evidence.file_url;
  const externalUrl = evidence.externalUrl || evidence.external_url;

  // Screenshot / DB Diagram → Image viewer
  if ((type === 'SCREENSHOT' || type === 'DB_DIAGRAM') && fileUrl) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">image</span>
          <span className="font-body-md text-body-md text-on-surface font-medium">Preview</span>
        </div>
        <div className="p-4 flex items-center justify-center bg-[#f0f0f0] min-h-[300px]">
          <img
            src={fileUrl}
            alt={evidence.title}
            className="max-w-full max-h-[500px] object-contain rounded-lg shadow-sm"
          />
        </div>
      </div>
    );
  }

  // Screen Recording → Video player
  if (type === 'SCREEN_RECORDING' && fileUrl) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">videocam</span>
          <span className="font-body-md text-body-md text-on-surface font-medium">Video Preview</span>
        </div>
        <div className="p-4 flex items-center justify-center bg-[#1e1e2e] min-h-[300px]">
          <video
            src={fileUrl}
            controls
            className="max-w-full max-h-[500px] rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    );
  }

  // API Response / Test Result → Code block
  if (type === 'API_RESPONSE' || type === 'TEST_RESULT') {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">data_object</span>
          <span className="font-body-md text-body-md text-on-surface font-medium">Content</span>
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-primary hover:underline font-body-md text-[13px] flex items-center gap-1"
            >
              Open URL <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          )}
        </div>
        <div className="bg-[#1e1e2e] p-5 overflow-x-auto">
          <pre className="text-[#cdd6f4] font-label-md text-[13px] leading-relaxed whitespace-pre-wrap">
            {evidence.description || externalUrl || 'No content available'}
          </pre>
        </div>
      </div>
    );
  }

  // GitHub Commit → Commit info card
  if (type === 'GITHUB_COMMIT') {
    const metadata = evidence.metadata || {};
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">commit</span>
          <span className="font-body-md text-body-md text-on-surface font-medium">GitHub Commit</span>
        </div>
        <div className="p-5">
          <div className="bg-surface-container border border-outline-variant rounded-xl p-4 space-y-3">
            {metadata.commitSha && (
              <div className="flex items-center gap-2">
                <span className="font-label-md text-label-md text-on-surface-variant w-20">SHA</span>
                <code className="font-label-md text-[13px] text-primary bg-primary-fixed/20 px-2 py-0.5 rounded-md">
                  {metadata.commitSha?.slice(0, 7)}
                </code>
              </div>
            )}
            {metadata.author && (
              <div className="flex items-center gap-2">
                <span className="font-label-md text-label-md text-on-surface-variant w-20">Author</span>
                <span className="font-body-md text-body-md text-on-surface">{metadata.author}</span>
              </div>
            )}
            {metadata.message && (
              <div className="flex items-start gap-2">
                <span className="font-label-md text-label-md text-on-surface-variant w-20 pt-0.5">Message</span>
                <span className="font-body-md text-body-md text-on-surface">{metadata.message}</span>
              </div>
            )}
            {externalUrl && (
              <div className="pt-2 border-t border-outline-variant">
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-body-md text-body-md flex items-center gap-1"
                >
                  View on GitHub <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Figma Link / Deploy Link → External link embed
  if (type === 'FIGMA_LINK' || type === 'DEPLOY_LINK') {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            {TYPE_ICON_MAP[type]}
          </span>
          <span className="font-body-md text-body-md text-on-surface font-medium">
            {type === 'FIGMA_LINK' ? 'Figma Design' : 'Deployment'}
          </span>
        </div>
        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant">{TYPE_ICON_MAP[type]}</span>
          </div>
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-body-md text-body-md shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              {type === 'FIGMA_LINK' ? 'Open in Figma' : 'Open Live URL'}
            </a>
          )}
          {evidence.description && (
            <p className="font-body-md text-[13px] text-on-surface-variant text-center max-w-md">
              {evidence.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Document / Survey → File download
  if (type === 'DOCUMENT' || type === 'SURVEY') {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">description</span>
          <span className="font-body-md text-body-md text-on-surface font-medium">Document</span>
        </div>
        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant">picture_as_pdf</span>
          </div>
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-body-md text-body-md shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Download File
            </a>
          )}
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-body-md text-[13px] flex items-center gap-1"
            >
              Open External Link <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">visibility</span>
        <span className="font-body-md text-body-md text-on-surface font-medium">Preview</span>
      </div>
      <div className="p-8 flex flex-col items-center gap-3 text-center">
        <span className="material-symbols-outlined text-[48px] text-outline-variant">preview</span>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Preview not available for this evidence type.
        </p>
        {(fileUrl || externalUrl) && (
          <a
            href={fileUrl || externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-body-md text-body-md flex items-center gap-1"
          >
            Open resource <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default EvidencePreview;

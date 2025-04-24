import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer'
import '@cyntler/react-doc-viewer/dist/index.css'

import PropTypes from 'prop-types'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FaDownload,
  FaFile,
  FaFileAlt,
  FaFileAudio,
  FaFileCode,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileVideo,
  FaFileWord,
  FaTimes,
} from 'react-icons/fa'

// Function to get file size in readable format
const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Function to get filename from URL
const getFilenameFromUrl = (url) => {
  if (!url) return 'Unknown file'
  return url.split('/').pop().split('#')[0].split('?')[0]
}

// Custom CSS to inject for Office file types
const officeDocumentStyles = `
/* General viewer styles */
.office-viewer {
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  width: 100% !important;
  overflow: hidden !important;
}

/* Prevent flickering by hiding the content until fully loaded */
.office-viewer.loading {
  visibility: hidden;
}

/* Doc viewer wrapper styles */
.pg-viewer-wrapper {
  overflow: hidden !important;
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  flex: 1 !important;
}

/* Office container */
.pg-viewer {
  height: 100% !important;
  flex: 1 !important;
  overflow: hidden !important;
  position: relative !important;
}

/* Main plugin renderers */
.plugin-office-container,
.plugin-office-wrapper {
  flex: 1 !important;
  height: 100% !important;
  width: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

/* Specifically target Office Online viewer */
.office-frame-container {
  flex: 1 !important;
  height: 100% !important;
  min-height: 100% !important;
  position: relative !important;
}

/* Target the iframe directly */
.react-doc-viewer iframe, 
.pg-viewer iframe,
.office-frame-container iframe,
.plugin-office-container iframe,
iframe[src*="officeapps.live.com"],
iframe[src*="view.officeapps.live.com"] {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  border: none !important;
  min-height: 70vh !important;
}

/* Target Microsoft's office container */
.plugin-office-container > div,
.office-frame-container > div {
  height: 100% !important;
  position: relative !important;
}

/* Target text documents */
.txt-renderer {
  height: 100% !important;
  width: 100% !important;
  padding: 20px !important;
  overflow: auto !important;
  background: white !important;
  white-space: pre-wrap !important;
}

/* Full screen modal */
.fullscreen-modal {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  margin: 0 !important;
  padding: 0 !important;
  border-radius: 0 !important;
  max-width: none !important;
  max-height: none !important;
}
`

const DocumentPreview = ({ fileUrl, fileType, fileSize, fileName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [displaySize, setDisplaySize] = useState('')
  const viewerContainerRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if file type is an Office document - wrapped in useCallback
  const isOfficeDocument = useCallback(() => {
    return ['DOCX', 'DOC', 'XLSX', 'XLS', 'PPTX', 'PPT', 'CSV', 'ODT'].includes(
      fileType,
    )
  }, [fileType])

  useEffect(() => {
    // Set the display name either from prop or extract from URL
    setDisplayName(fileName || getFilenameFromUrl(fileUrl))

    // Set the display size from prop or empty string
    setDisplaySize(fileSize ? formatFileSize(fileSize) : '')

    // Clean up modal on unmount
  
  }, [fileUrl, fileSize, fileName, isModalOpen])

  // Inject custom CSS when modal is opened
  useEffect(() => {
    if (isModalOpen) {
      // Add custom styles for Office documents
      const styleElement = document.createElement('style')
      styleElement.id = 'office-document-styles'
      styleElement.textContent = officeDocumentStyles
      document.head.appendChild(styleElement)

      // Cleanup when modal is closed
      return () => {
        const existingStyle = document.getElementById('office-document-styles')
        if (existingStyle) {
          existingStyle.remove()
        }
      }
    }
  }, [isModalOpen])

  // After the document viewer is rendered, apply some fixes for Office iframes
  useEffect(() => {
    if (isModalOpen && isOfficeDocument() && viewerContainerRef.current) {
      // Prevent re-triggering if iframe already exists
      const existingIframe = document.querySelector(
        '.office-frame-container iframe, .plugin-office-container iframe, iframe[src*="officeapps.live.com"]',
      );
      if (existingIframe) {
        setIsLoading(false);
        return;
      }

      // Set loading state
      setIsLoading(true);

      let timeoutId;

      // Wait for iframe to be created
      const checkForIframe = setInterval(() => {
        const iframe = document.querySelector(
          '.office-frame-container iframe, .plugin-office-container iframe, iframe[src*="officeapps.live.com"]',
        );
        if (iframe) {
          clearInterval(checkForIframe);

          // Apply height directly to the iframe
          iframe.style.height = '100%';
          iframe.style.minHeight = '70vh';
          iframe.style.position = 'absolute';
          iframe.style.top = '0';
          iframe.style.left = '0';
          iframe.style.width = '100%';

          // Add load event listener to iframe
          iframe.addEventListener('load', () => {
            setIsLoading(false);
          });

          // Set a fallback timeout in case the load event doesn't fire
          timeoutId = setTimeout(() => {
            setIsLoading(false);
          }, 5000);
        }
      }, 300);

      // Maximum waiting time for iframe to appear
      const maxWaitTimeout = setTimeout(() => {
        clearInterval(checkForIframe);
        setIsLoading(false);
      }, 10000);

      return () => {
        clearInterval(checkForIframe);
        clearTimeout(timeoutId);
        clearTimeout(maxWaitTimeout);
      };
    }
  }, [isModalOpen, isOfficeDocument]);

  // Make sure we always reset loading state when modal is closed
  useEffect(() => {
    if (!isModalOpen) {
      setIsLoading(false)
    }
  }, [isModalOpen])

  // Get the appropriate icon based on file type
  const getFileIcon = () => {
    switch (fileType) {
      case 'PDF':
        return <FaFilePdf className="h-12 w-12 text-red-500" />
      case 'DOCX':
      case 'DOC':
      case 'ODT':
        return <FaFileWord className="h-12 w-12 text-blue-500" />
      case 'XLSX':
      case 'XLS':
      case 'CSV':
        return <FaFileExcel className="h-12 w-12 text-green-500" />
      case 'PPTX':
      case 'PPT':
        return <FaFilePowerpoint className="h-12 w-12 text-orange-500" />
      case 'TXT':
        return <FaFileAlt className="h-12 w-12 text-gray-500" />
      case 'HTML':
        return <FaFileCode className="h-12 w-12 text-purple-500" />
      case 'BMP':
      case 'TIFF':
        return <FaFileImage className="h-12 w-12 text-indigo-500" />
      case 'MP4':
        return <FaFileVideo className="h-12 w-12 text-pink-500" />
      case 'MP3':
      case 'WAV':
        return <FaFileAudio className="h-12 w-12 text-yellow-500" />
      default:
        return <FaFile className="h-12 w-12 text-gray-500" />
    }
  }

  // Handle file download
  const handleDownload = (e) => {
    e.stopPropagation() // Prevent opening the modal when clicking download

    // Create an anchor element and simulate a click
    const anchor = document.createElement('a')
    anchor.href = fileUrl
    anchor.download = displayName // Suggest file name to save as
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  // Callback for when the document is rendered
  const onDocumentLoad = () => {
    console.log('Document loaded!')
    // For non-Office documents, set loading to false
    if (!isOfficeDocument()) {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* File Preview Card */}
      <div
        className="flex w-full max-w-[360px] cursor-pointer items-center rounded-lg bg-white p-3 transition-colors"
        onClick={() => {
          setIsModalOpen(true)
          setIsLoading(true)
        }}
      >
        <div className="mr-3 flex-shrink-0">{getFileIcon()}</div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {displayName}
          </p>
          {displaySize && (
            <p className="text-xs text-gray-500">{displaySize}</p>
          )}
        </div>

        <button
          className="ml-2 rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
          onClick={handleDownload}
        >
          <FaDownload className="h-5 w-5" />
        </button>
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="fullscreen-modal flex flex-col bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b bg-gray-100 p-3">
              <h3 className="truncate text-lg font-semibold">{displayName}</h3>
              <button
                className="rounded-full p-2 hover:bg-gray-200"
                onClick={() => setIsModalOpen(false)}
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            {/* Document Viewer Container */}
            <div
              ref={viewerContainerRef}
              className={`flex-1 overflow-hidden ${isOfficeDocument() ? 'office-viewer' : ''}`}
              style={{ height: 'calc(100% - 110px)', position: 'relative' }} // Ensure relative positioning for the button
            >
              {/* Close Button */}
              

              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
                  <div className="text-center">
                    <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                    <p className="text-gray-700">Loading document...</p>
                  </div>
                </div>
              )}

              <DocViewer
                documents={[{ uri: fileUrl, fileName: displayName }]}
                pluginRenderers={DocViewerRenderers}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                config={{
                  header: {
                    disableHeader: true,
                    disableFileName: true,
                    retainURLParams: true,
                  },
                  loadingRenderer: {
                    overrideComponent: () => null, // Hide default loader
                    showLoadingTimeout: false,
                  },
                  pdfVerticalScrollByDefault: true,
                  pdfZoom: {
                    defaultZoom: 1.0,
                    zoomJump: 0.1,
                  },
                  csv: {
                    separatorInHeader: true,
                    fixedWidth: true,
                    parser: {
                      delimitersToGuess: [',', '\t', '|', ';'],
                    },
                  },
                }}
                theme={{
                  primary: '#0ea5e9',
                  secondary: '#64748b',
                  tertiary: '#334155',
                  textPrimary: '#0f172a',
                  textSecondary: '#64748b',
                  textTertiary: '#94a3b8',
                  background: '#ffffff',
                  disableThemeScrollbar: false,
                }}
                className={isOfficeDocument() ? 'office-document-viewer' : ''}
                onDocumentLoad={onDocumentLoad}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex flex-shrink-0 justify-end border-t bg-gray-100 p-3">
              <button
                className="flex items-center rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                onClick={handleDownload}
              >
                <FaDownload className="mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

DocumentPreview.propTypes = {
  fileUrl: PropTypes.string.isRequired,
  fileType: PropTypes.string.isRequired,
  fileSize: PropTypes.number,
  fileName: PropTypes.string,
}

export default DocumentPreview

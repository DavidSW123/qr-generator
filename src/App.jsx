import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import './App.css'

export default function App() {
  const [qrValue, setQrValue] = useState('https://example.com')
  const [qrColor, setQrColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [size, setSize] = useState(300)
  const [logo, setLogo] = useState(null)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({ total: 0, today: 0 })
  const [shareUrl, setShareUrl] = useState('')
  const qrRef = useRef()
  const canvasRef = useRef()

  useEffect(() => {
    generateQRCode()
    loadStats()
  }, [qrValue, qrColor, bgColor, size])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('data')) {
      const data = JSON.parse(atob(params.get('data')))
      setQrValue(data.value || 'https://example.com')
      setQrColor(data.color || '#000000')
      setBgColor(data.bgColor || '#ffffff')
      setSize(data.size || 300)
    }
  }, [])

  const generateQRCode = async () => {
    if (!canvasRef.current || !qrValue.trim()) return

    try {
      await QRCode.toCanvas(canvasRef.current, qrValue || 'https://example.com', {
        width: size,
        color: {
          dark: qrColor,
          light: bgColor
        },
        margin: 1,
        errorCorrectionLevel: 'H'
      })
    } catch (err) {
      console.error('Error generating QR:', err)
    }
  }

  const addToHistory = () => {
    if (qrValue.trim()) {
      setHistory([
        { id: Date.now(), value: qrValue, color: qrColor, bgColor, size, logo },
        ...history.slice(0, 9)
      ])
      updateStats()
    }
  }

  const downloadQR = async (format = 'png') => {
    if (!qrRef.current) return
    try {
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: bgColor,
        scale: 2
      })

      if (format === 'png') {
        const link = document.createElement('a')
        link.href = canvas.toDataURL('image/png')
        link.download = `qr-code-${Date.now()}.png`
        link.click()
      } else if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        pdf.addImage(imgData, 'PNG', 10, 10, 190, 190)
        pdf.save(`qr-code-${Date.now()}.pdf`)
      }
    } catch (err) {
      console.error('Error downloading QR:', err)
    }
  }

  const generateShareUrl = () => {
    const data = { value: qrValue, color: qrColor, bgColor, size }
    const encoded = btoa(JSON.stringify(data))
    const url = `${window.location.origin}?data=${encoded}`
    setShareUrl(url)
  }

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl)
    alert('URL copiada al portapapeles')
  }

  const loadStats = () => {
    const stored = localStorage.getItem('qr-stats') || '{"total":0,"today":0}'
    const data = JSON.parse(stored)
    const today = new Date().toDateString()
    const lastDate = localStorage.getItem('qr-stats-date')

    if (lastDate !== today) {
      data.today = 0
      localStorage.setItem('qr-stats-date', today)
    }

    setStats(data)
  }

  const updateStats = () => {
    const newStats = {
      total: stats.total + 1,
      today: stats.today + 1
    }
    setStats(newStats)
    localStorage.setItem('qr-stats', JSON.stringify(newStats))
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setLogo(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => setLogo(null)

  const loadFromHistory = (item) => {
    setQrValue(item.value)
    setQrColor(item.color)
    setBgColor(item.bgColor)
    setSize(item.size)
    setLogo(item.logo)
  }

  const clearHistory = () => setHistory([])

  return (
    <div className="app">
      <header className="header">
        <h1>🎯 QR Code Generator</h1>
        <p>Crea códigos QR profesionales y personalizados</p>
        <div className="stats-bar">
          <span>📊 Total: {stats.total}</span>
          <span>📅 Hoy: {stats.today}</span>
        </div>
      </header>

      <div className="container">
        <div className="generator-section">
          <div className="controls">
            <div className="control-group">
              <label>Texto o URL</label>
              <input
                type="text"
                value={qrValue}
                onChange={(e) => setQrValue(e.target.value)}
                placeholder="Ingresa URL o texto..."
              />
            </div>

            <div className="control-row">
              <div className="control-group">
                <label>Color QR</label>
                <div className="color-input">
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                  />
                  <span>{qrColor}</span>
                </div>
              </div>

              <div className="control-group">
                <label>Color Fondo</label>
                <div className="color-input">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                  />
                  <span>{bgColor}</span>
                </div>
              </div>

              <div className="control-group">
                <label>Tamaño: {size}px</label>
                <input
                  type="range"
                  min="150"
                  max="500"
                  value={size}
                  onChange={(e) => setSize(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="control-group">
              <label>Logo (opcional)</label>
              <div className="logo-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  id="logo-input"
                />
                <label htmlFor="logo-input">Subir Logo</label>
                {logo && (
                  <button className="btn-small btn-remove" onClick={removeLogo}>
                    ✕ Remover
                  </button>
                )}
              </div>
            </div>

            <div className="button-group">
              <button className="btn btn-primary" onClick={addToHistory}>
                ✓ Generar QR
              </button>
              <button className="btn btn-success" onClick={() => downloadQR('png')}>
                🖼 PNG
              </button>
              <button className="btn btn-success" onClick={() => downloadQR('pdf')}>
                📄 PDF
              </button>
              <button className="btn btn-info" onClick={generateShareUrl}>
                🔗 Compartir
              </button>
            </div>

            {shareUrl && (
              <div className="share-section">
                <p>URL para compartir:</p>
                <div className="share-url">
                  <input type="text" readOnly value={shareUrl} />
                  <button className="btn-copy" onClick={copyShareUrl}>
                    Copiar
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="preview-section">
            <div className="qr-container" ref={qrRef} style={{ backgroundColor: bgColor, padding: '20px' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <canvas ref={canvasRef} />
                {logo && (
                  <img
                    src={logo}
                    alt="Logo"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: size * 0.25,
                      height: size * 0.25,
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      padding: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="history-section">
            <div className="history-header">
              <h2>Historial ({history.length})</h2>
              <button className="btn-small btn-remove" onClick={clearHistory}>
                Limpiar
              </button>
            </div>
            <div className="history-grid">
              {history.map((item) => (
                <div key={item.id} className="history-item" onClick={() => loadFromHistory(item)}>
                  <div className="history-preview">
                    <span>{item.value.substring(0, 20)}</span>
                  </div>
                  <div className="history-info">
                    <p className="history-text">{item.value.substring(0, 30)}...</p>
                    <small>{new Date(item.id).toLocaleTimeString()}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
// Deploy trigger

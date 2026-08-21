import { app, BrowserWindow } from 'electron'
import { registerMetricsIpc } from './ipc/metrics.ipc'
import { createMainWindow } from './window'

app.whenReady().then(() => {
  const mainWindow = createMainWindow()
  const disposeMetricsIpc = registerMetricsIpc(mainWindow)
  mainWindow.on('closed', () => disposeMetricsIpc())

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

import { useCallback, useEffect, useRef, useState } from "react"

import Desktop from "./os/Desktop.jsx"
import Taskbar from "./os/Taskbar.jsx"
import StartMenu from "./os/StartMenu.jsx"
import Win98Window from "./os/Win98Window.jsx"
import Boot, { PoweredOff } from "./os/Boot.jsx"
import { APPS } from "./os/appSpecs.js"
import { useWindows, open, closeAll } from "./os/windowStore.js"

import Specs from "./apps/Specs.jsx"
import Gallery from "./apps/Gallery.jsx"
import VideoWindow from "./apps/VideoWindow.jsx"
import Terminal from "./apps/Terminal.jsx"
import Generator from "./apps/Generator.jsx"
import Analyzer from "./apps/Analyzer.jsx"
import Chat from "./apps/Chat.jsx"
import About from "./apps/About.jsx"
import Fakeamp from "./apps/Fakeamp.jsx"
import ErrorBomb from "./apps/ErrorBomb.jsx"

import { bootChime, setUiVolume } from "./audio.js"

// Kept separate from appSpecs so any app can import the specs without pulling
// in every component (and creating an import cycle).
const COMPONENTS = {
  specs: Specs,
  gallery: Gallery,
  video: VideoWindow,
  console: Terminal,
  generator: Generator,
  analyzer: Analyzer,
  chat: Chat,
  about: About,
}

export default function App() {
  const windows = useWindows()
  const [phase, setPhase] = useState("boot") // boot | on | off
  const [startOpen, setStartOpen] = useState(false)
  const [amp, setAmp] = useState(false)
  const [bomb, setBomb] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const webampRef = useRef(null)

  useEffect(() => setUiVolume(volume), [volume])

  const launch = useCallback((id) => {
    if (id === "fakeamp") {
      setAmp(true)
      return true
    }
    if (id === "clickme") {
      setBomb(true)
      return true
    }
    const spec = APPS[id]
    if (!spec) return false
    open(id, spec)
    return true
  }, [])

  const handleShutdown = () => {
    setStartOpen(false)
    setAmp(false)
    setBomb(false)
    closeAll()
    setPhase("off")
  }

  if (phase === "boot") {
    return (
      <Boot
        onDone={() => {
          setPhase("on")
          bootChime()
        }}
      />
    )
  }

  if (phase === "off") {
    return <PoweredOff onReboot={() => setPhase("boot")} />
  }

  return (
    <>
      <Desktop onLaunch={launch} />

      {windows.map((win) => {
        const Component = COMPONENTS[win.appId]
        if (!Component) return null
        if (win.minimized) return null
        return (
          <Win98Window key={win.id} win={win}>
            {win.appId === "console" ? (
              <Terminal
                onOpen={(name) => launch(name.toLowerCase())}
                onPlay={() => {
                  setAmp(true)
                  webampRef.current?.play()
                }}
                onStop={() => webampRef.current?.stop()}
                onDrift={() => setBomb(true)}
              />
            ) : (
              <Component />
            )}
          </Win98Window>
        )
      })}

      <Fakeamp
        visible={amp}
        volume={volume}
        instanceRef={webampRef}
        onClose={() => setAmp(false)}
      />

      <ErrorBomb active={bomb} onDone={() => setBomb(false)} />

      {startOpen && (
        <StartMenu
          onClose={() => setStartOpen(false)}
          onLaunch={launch}
          onShutdown={handleShutdown}
        />
      )}

      <Taskbar
        startOpen={startOpen}
        onToggleStart={() => setStartOpen((v) => !v)}
        volume={volume}
        onVolume={setVolume}
        extraTasks={
          amp
            ? [
                {
                  id: "fakeamp",
                  icon: "winamp",
                  title: "Fakeamp",
                  active: true,
                  onClick: () => setAmp(false),
                },
              ]
            : []
        }
      />
    </>
  )
}

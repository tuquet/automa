use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, State, Emitter};
use std::io::{Read, Write};
use std::thread;

pub struct PtySession {
    pub master: Box<dyn portable_pty::MasterPty + Send>,
    pub writer: Box<dyn std::io::Write + Send>,
}

pub struct PtyState {
    pub sessions: Mutex<HashMap<String, PtySession>>,
}

impl Default for PtyState {
    fn default() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }
}

#[tauri::command]
pub fn spawn_pty(app: AppHandle, state: State<'_, PtyState>, id: String, cols: u16, rows: u16, profile: Option<String>) -> Result<(), String> {
    let pty_system = native_pty_system();
    
    let pair = pty_system.openpty(PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
    }).map_err(|e| e.to_string())?;
    
    let cmd = if cfg!(target_os = "windows") {
        match profile.as_deref() {
            Some("cmd") => CommandBuilder::new("cmd.exe"),
            Some("git-bash") => CommandBuilder::new("C:\\Program Files\\Git\\bin\\bash.exe"),
            _ => CommandBuilder::new("powershell.exe"), // default
        }
    } else {
        match profile.as_deref() {
            Some("zsh") => CommandBuilder::new("zsh"),
            _ => CommandBuilder::new("bash"),
        }
    };
    
    pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?; 

    {
        state.sessions.lock().unwrap().insert(id.clone(), PtySession {
            master: pair.master,
            writer,
        });
    }
    
    let event_name = format!("pty-data-{}", id);
    thread::spawn(move || {
        let mut buf = [0u8; 1024];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let data = buf[..n].to_vec();
                    let _ = app.emit(&event_name, data);
                }
                Err(_) => break,
            }
        }
    });
    
    Ok(())
}

#[tauri::command]
pub fn write_pty(state: State<'_, PtyState>, id: String, data: String) -> Result<(), String> {
    let mut sessions = state.sessions.lock().unwrap();
    if let Some(session) = sessions.get_mut(&id) {
        session.writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn resize_pty(state: State<'_, PtyState>, id: String, cols: u16, rows: u16) -> Result<(), String> {
    let sessions = state.sessions.lock().unwrap();
    if let Some(session) = sessions.get(&id) {
        session.master.resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        }).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn kill_pty(state: State<'_, PtyState>, id: String) -> Result<(), String> {
    let mut sessions = state.sessions.lock().unwrap();
    sessions.remove(&id);
    Ok(())
}

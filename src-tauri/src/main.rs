use tauri::menu::{Menu, MenuItem, Submenu, PredefinedMenuItem};
use tauri::{Manager, Emitter};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[tauri::command]
fn close_window(window: tauri::Window) {
    window.close().unwrap();
}

#[tauri::command]
fn minimize_window(window: tauri::Window) {
    window.minimize().unwrap();
}

#[tauri::command]
fn maximize_window(window: tauri::Window) {
    window.maximize().unwrap();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let handle = app.handle();
            
            // File Menu
            let open_item = MenuItem::with_id(handle, "open", "Open...", true, None::<&str>)?;
            let save_item = MenuItem::with_id(handle, "save", "Save Palette...", true, None::<&str>)?;
            let file_menu = Submenu::with_items(
                handle,
                "File",
                true,
                &[
                    &open_item,
                    &save_item,
                    &PredefinedMenuItem::separator(handle)?,
                    &PredefinedMenuItem::quit(handle, None)?,
                ],
            )?;

            // Edit Menu
            let edit_menu = Submenu::with_items(
                handle,
                "Edit",
                true,
                &[
                    &PredefinedMenuItem::undo(handle, None)?,
                    &PredefinedMenuItem::redo(handle, None)?,
                    &PredefinedMenuItem::separator(handle)?,
                    &PredefinedMenuItem::cut(handle, None)?,
                    &PredefinedMenuItem::copy(handle, None)?,
                    &PredefinedMenuItem::paste(handle, None)?,
                ],
            )?;

            let menu = Menu::with_items(handle, &[&file_menu, &edit_menu])?;
            app.set_menu(menu)?;

            app.on_menu_event(move |app, event| {
                match event.id().as_ref() {
                    "open" => {
                        let _ = app.emit("menu-open", ());
                    }
                    "save" => {
                        let _ = app.emit("menu-save", ());
                    }
                    _ => {}
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, close_window, minimize_window, maximize_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

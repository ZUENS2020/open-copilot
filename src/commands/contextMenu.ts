import { getCommandId, sortCommandsByOrder } from "@/commands/customCommandUtils";
import { getCachedCustomCommands } from "@/commands/state";
import { COMMAND_IDS } from "@/constants";
import { Menu } from "obsidian";
import { CustomCommand } from "./type";

/**
 * Helper to set submenu on a menu item
 */
function setSubmenu(item: { setSubmenu?: () => void }): void {
  item.setSubmenu?.();
}

/**
 * Helper to get submenu from a menu item
 */
function getSubmenu(item: { submenu?: Menu }): Menu | undefined {
  return item.submenu;
}

/**
 * Helper to execute a command by ID
 */
function executeCommandById(commandId: string): void {
  (
    app as { commands?: { executeCommandById?: (id: string) => void } }
  ).commands?.executeCommandById?.(commandId);
}

export function registerContextMenu(menu: Menu) {
  // Create the main "Copilot" submenu
  menu.addItem((item) => {
    item.setTitle("Copilot");
    setSubmenu(item);

    const submenu = getSubmenu(item);
    if (!submenu) return;

    // Add the main selection command
    submenu.addItem((subItem) => {
      subItem.setTitle("Add selection to chat context").onClick(() => {
        executeCommandById(`open-copilot:${COMMAND_IDS.ADD_SELECTION_TO_CHAT_CONTEXT}`);
      });
    });

    submenu.addItem((subItem) => {
      subItem.setTitle("Trigger quick command").onClick(() => {
        executeCommandById(`open-copilot:${COMMAND_IDS.TRIGGER_QUICK_COMMAND}`);
      });
    });

    // Get custom commands
    const commands = getCachedCustomCommands();
    const visibleCustomCommands = commands.filter(
      (command: CustomCommand) => command.showInContextMenu
    );

    // Add separator if there are custom commands
    if (visibleCustomCommands.length > 0) {
      submenu.addSeparator();
    }

    // Add custom commands to submenu
    sortCommandsByOrder(visibleCustomCommands).forEach((command: CustomCommand) => {
      submenu.addItem((subItem) => {
        subItem.setTitle(command.title).onClick(() => {
          executeCommandById(`open-copilot:${getCommandId(command.title)}`);
        });
      });
    });
  });
}

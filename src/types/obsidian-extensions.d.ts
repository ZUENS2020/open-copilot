/**
 * Type extensions for Obsidian API
 *
 * These extend the official Obsidian types with properties that exist
 * at runtime but are not included in the official type definitions.
 */

declare module "obsidian" {
  interface Menu {
    /**
     * Submenu attached to this menu item
     * Not officially typed but available at runtime
     */
    submenu?: Menu;
  }

  interface MenuItem {
    /**
     * Sets this menu item to have a submenu
     * Not officially typed but available at runtime
     */
    setSubmenu?(): this;
  }

  interface MetadataCache {
    /**
     * Block-level metadata cache
     * Indexed by block ID (e.g., for ^block references)
     */
    blocks?: Record<
      string,
      {
        position?: {
          start?: { offset?: number };
          end?: { offset?: number };
        };
      }
    >;
  }
}

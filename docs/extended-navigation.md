# Extended navigation, overlays, and feedback

This file documents names added by `extended-navigation.tsx`. Existing exports remain the canonical implementations: `Tabs`, `Breadcrumb`, `Pagination`, `SegmentedControl`, `Menu`, `Tooltip`, `Dialog`, `Alert`, `ProgressBar`, `Skeleton`, `Result`, `ToastProvider`, and `useToast`.

| Checklist name                                 | Public API / mapping                                                |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| Anchor                                         | `Anchor` styled native link                                         |
| Breadcrumb, Tabs, SegmentedControl, Pagination | existing exports                                                    |
| Stepper                                        | `Stepper({ items, current, onStepChange? })`                        |
| Menu                                           | existing `Menu`                                                     |
| DropdownMenu                                   | `DropdownMenu` alias of `Menu`                                      |
| ContextMenu                                    | `ContextMenu({ trigger, children })`                                |
| NavigationMenu, MegaMenu                       | labelled native `nav` containers                                    |
| Sidebar                                        | `Sidebar` alias of `SideNav`                                        |
| BottomNavigation                               | `BottomNavigation({ label, items, value?, onValueChange? })`        |
| CommandPalette                                 | `CommandPalette({ open, onClose, commands })`                       |
| BackToTop                                      | `BackToTop` scroll button                                           |
| Tooltip                                        | existing `Tooltip`                                                  |
| Popover, HoverCard                             | trigger/content overlays                                            |
| Modal                                          | `Modal` alias of `Dialog`                                           |
| AlertDialog                                    | non-dismissible `Dialog`                                            |
| Drawer, Sheet                                  | `Dialog` variants                                                   |
| Tour                                           | controlled `Tour({ steps, current, onStepChange? })`                |
| Alert                                          | existing `Alert`                                                    |
| Message, Toast, Notification                   | static status surfaces; use `ToastProvider` for queued timed toasts |
| Progress                                       | `Progress` alias of `ProgressBar`                                   |
| CircularProgress, Spinner                      | accessible progress/status indicators                               |
| Skeleton, Result                               | existing exports                                                    |
| ErrorState                                     | danger-tone `Result`                                                |

`CommandPalette` commands accept `id`, `label`, `onSelect`, optional `description`, `keywords`, `shortcut`, and `disabled`. Search matches all whitespace-separated terms against labels, descriptions, and keywords without case sensitivity. Opening resets the query; arrows move between enabled commands, Enter in the input executes the first enabled match, and Escape closes the dialog. IME composition does not execute commands. The docs site reuses this component for top-bar global search (⌘K / Ctrl+K), covering component names, screen examples, and document titles/descriptions—not document full text.

Ceilings: `ContextMenu`, `Popover`, and `HoverCard` use simple local positioning; consumers needing viewport collision detection or portals should compose the existing primitives with their positioning solution. Hierarchical commands and async search belong to the product layer.

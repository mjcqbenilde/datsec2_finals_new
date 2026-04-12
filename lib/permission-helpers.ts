/** True if user has any permission whose module_key is `prefix` or starts with `prefix.` */
export function hasModuleFamily(
  permissionKeys: Set<string>,
  prefix: string,
): boolean {
  for (const k of permissionKeys) {
    const moduleKey = k.split(":")[0] ?? "";
    if (moduleKey === prefix || moduleKey.startsWith(`${prefix}.`)) {
      return true;
    }
  }
  return false;
}

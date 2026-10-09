// اختيار التركيبة خاصية بخاصية — نفس منطق صفحة تعديل الطلب في لوحة التحكم.
// attrId غالباً فارغ في البيانات، فالتجميع بالاسم attrName.

const keyOf = (a) => a.attrName || a.attrId || '';

export function attributeGroups(variants) {
  const groups = [];
  const index = {};
  (variants || []).forEach((v) => {
    (Array.isArray(v.name) ? v.name : []).forEach((a) => {
      const key = keyOf(a);
      if (!index[key]) {
        index[key] = { key, attrName: a.attrName, displayMode: a.displayMode, options: [] };
        groups.push(index[key]);
      }
      if (!index[key].options.some((o) => o.value === a.value)) index[key].options.push({ value: a.value });
    });
  });
  return groups;
}

export function findVariant(variants, currentAttrs, key, value) {
  const target = {};
  (currentAttrs || []).forEach((a) => { target[keyOf(a)] = a.value; });
  target[key] = value;
  const exact = (variants || []).find((v) => Array.isArray(v.name) && v.name.length && v.name.every((a) => target[keyOf(a)] === a.value));
  if (exact) return exact;
  return (variants || []).find((v) => Array.isArray(v.name) && v.name.some((a) => keyOf(a) === key && a.value === value)) || null;
}

export const attrKey = keyOf;

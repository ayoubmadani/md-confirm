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

// متوفر = مخزون > 0 أو «متوفر دائماً» (autoGenerate) — نفس قاعدة المتجر
export const isAvailable = (v) => !!v && (v.autoGenerate || Number(v.stock) > 0);

const targetOf = (currentAttrs, key, value) => {
  const target = {};
  (currentAttrs || []).forEach((a) => { target[keyOf(a)] = a.value; });
  target[key] = value;
  return target;
};
const exactMatch = (variants, target) =>
  (variants || []).find((v) => Array.isArray(v.name) && v.name.length && v.name.every((a) => target[keyOf(a)] === a.value)) || null;
const withValue = (variants, key, value) =>
  (variants || []).filter((v) => Array.isArray(v.name) && v.name.some((a) => keyOf(a) === key && a.value === value));
// كل الخصائص محددة (لون + مقاس + …) ← التركيبة معروفة بالضبط، فلا بديل لها
const isComplete = (variants, target) => attributeGroups(variants).every((g) => target[g.key] !== undefined && target[g.key] !== '');

// الخيارات المعطّلة من التاجر لا تصل أصلاً (الـ API يرسل المفعّلة فقط)، فتركيبة كاملة غير موجودة = غير متاحة
export function findVariant(variants, currentAttrs, key, value) {
  const target = targetOf(currentAttrs, key, value);
  const exact = exactMatch(variants, target);
  if (exact) return isAvailable(exact) ? exact : null;
  if (isComplete(variants, target)) return null;
  // طلب بلا اختيار سابق: أول تركيبة متوفرة بهذه القيمة
  return withValue(variants, key, value).find(isAvailable) || null;
}

// هل يمكن اختيار هذه القيمة مع الخيارات الأخرى المختارة حالياً؟
export function optionAvailable(variants, currentAttrs, key, value) {
  return !!findVariant(variants, currentAttrs, key, value);
}

export const attrKey = keyOf;

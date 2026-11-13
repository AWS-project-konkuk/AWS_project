import { z } from 'zod';

export const inputLimits = {
  aiReason: 300,
  author: 20,
  title: 20,
  nodeName: 20,
  password: 20,
  body: 500,
} as const;

function limitedText(label: string, max: number) {
  return z.string({ error: `${label} 항목을 입력해 주세요.` }).max(max, {
    error: `${label} 항목은 ${max}자 이하로 입력해 주세요.`,
  });
}

function requiredText(label: string, max: number) {
  return limitedText(label, max).refine((value) => value.trim().length > 0, {
    error: `${label} 항목을 입력해 주세요.`,
  });
}

export const aiReasonSchema = requiredText('선택한 이유', inputLimits.aiReason);
export const nodeNameSchema = requiredText('노드 이름', inputLimits.nodeName).trim();
export const passwordSchema = requiredText('비밀번호', inputLimits.password);

const title = requiredText('제목', inputLimits.title).trim();
const body = requiredText('내용', inputLimits.body).trim();

export const createPostSchema = z.object({
  author: requiredText('작성자', inputLimits.author).trim(),
  title,
  body,
  password: passwordSchema,
});

export const updatePostSchema = z.object({
  title,
  body: body.optional(),
  password: passwordSchema,
});

export function validateInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues[0].message);
  return result.data;
}

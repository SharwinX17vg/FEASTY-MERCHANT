type DatabaseError = {
  code?: string;
  status?: number;
};

export function mutationErrorResponse(error: DatabaseError, fallbackMessage: string) {
  if (error.code === "42501" || error.status === 401 || error.status === 403) {
    return { message: "You do not have permission to perform this action.", status: 403 };
  }
  if (error.code === "23505") {
    return { message: "This record conflicts with an existing record.", status: 409 };
  }
  if (error.code === "23502" || error.code === "22P02" || error.code?.startsWith("23514")) {
    return { message: "The submitted values are not valid.", status: 400 };
  }
  return { message: fallbackMessage, status: 503 };
}

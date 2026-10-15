export const CAPTURE_PARTY_SCHEMA =
  "capture-party-v1";

function requiredText(value, field) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new TypeError(
      field + " must be a non-empty string"
    );
  }

  return value.trim();
}

export function normalizeCapturePartyV1(
  input
) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new TypeError(
      "CapturePartyV1 must be an object"
    );
  }

  if (
    input.schema !== CAPTURE_PARTY_SCHEMA ||
    input.version !== 1
  ) {
    throw new RangeError(
      "unsupported CaptureParty version"
    );
  }

  if (
    !Array.isArray(input.members) ||
    input.members.length === 0
  ) {
    throw new TypeError(
      "members must be a non-empty array"
    );
  }

  const members = input.members.map(
    (member, index) => {
      if (
        !member ||
        typeof member !== "object" ||
        Array.isArray(member)
      ) {
        throw new TypeError(
          `members[${index}] must be an object`
        );
      }

      return Object.freeze({
        id: requiredText(
          member.id,
          `members[${index}].id`
        ),
        creatureId: requiredText(
          member.creatureId,
          `members[${index}].creatureId`
        )
      });
    }
  );

  const memberIds =
    members.map((member) => member.id);

  if (
    new Set(memberIds).size !==
    memberIds.length
  ) {
    throw new RangeError(
      "members contains duplicate member ids"
    );
  }

  const activeMemberId =
    requiredText(
      input.activeMemberId,
      "activeMemberId"
    );

  if (
    !members.some(
      (member) =>
        member.id === activeMemberId
    )
  ) {
    throw new RangeError(
      "activeMemberId must reference a party member"
    );
  }

  return Object.freeze({
    schema: CAPTURE_PARTY_SCHEMA,
    version: 1,
    id: requiredText(
      input.id,
      "id"
    ),
    activeMemberId,
    members: Object.freeze(members)
  });
}

/* eslint-disable consistent-return */

import { IntlShape } from "react-intl";
import {
  CriterionModifier,
  HierarchicalMultiCriterionInput,
  IntCriterionInput,
  MultiCriterionInput,
  PHashDuplicationCriterionInput,
  StringCriterionInput,
} from "src/core/generated-graphql";
import DurationUtils from "src/utils/duration";
import {
  CriterionType,
  IHierarchicalLabelValue,
  ILabeledId,
  ILabeledValue,
  INumberValue,
  IOptionType,
  IStringValue,
} from "../types";

export type Option = string | number | IOptionType;
export type CriterionValue =
  | string
  | IStringValue
  | ILabeledId[]
  | IHierarchicalLabelValue
  | INumberValue;

const modifierMessageIDs = {
  [CriterionModifier.Equals]: "criterion_modifier.equals",
  [CriterionModifier.NotEquals]: "criterion_modifier.not_equals",
  [CriterionModifier.GreaterThan]: "criterion_modifier.greater_than",
  [CriterionModifier.LessThan]: "criterion_modifier.less_than",
  [CriterionModifier.IsNull]: "criterion_modifier.is_null",
  [CriterionModifier.NotNull]: "criterion_modifier.not_null",
  [CriterionModifier.Includes]: "criterion_modifier.includes",
  [CriterionModifier.IncludesAll]: "criterion_modifier.includes_all",
  [CriterionModifier.Excludes]: "criterion_modifier.excludes",
  [CriterionModifier.MatchesRegex]: "criterion_modifier.matches_regex",
  [CriterionModifier.NotMatchesRegex]: "criterion_modifier.not_matches_regex",
  [CriterionModifier.Between]: "criterion_modifier.between",
  [CriterionModifier.NotBetween]: "criterion_modifier.not_between",
};

// V = criterion value type
export abstract class Criterion<V extends CriterionValue> {
  public static getModifierOption(
    modifier: CriterionModifier = CriterionModifier.Equals
  ): ILabeledValue {
    const messageID = modifierMessageIDs[modifier];
    return { value: modifier, label: messageID };
  }

  public criterionOption: CriterionOption;
  public modifier: CriterionModifier;

  protected _value!: V;
  public get value(): V {
    return this._value;
  }
  public set value(newValue: V) {
    this._value = newValue;
  }

  public abstract getLabelValue(): string;

  constructor(type: CriterionOption, value: V) {
    this.criterionOption = type;
    this.modifier = type.defaultModifier;
    this.value = value;
  }

  public static getModifierLabel(intl: IntlShape, modifier: CriterionModifier) {
    const modifierMessageID = modifierMessageIDs[modifier];

    return modifierMessageID
      ? intl.formatMessage({ id: modifierMessageID })
      : "";
  }

  public getLabel(intl: IntlShape): string {
    const modifierString = Criterion.getModifierLabel(intl, this.modifier);
    let valueString = "";

    if (
      this.modifier !== CriterionModifier.IsNull &&
      this.modifier !== CriterionModifier.NotNull
    ) {
      valueString = this.getLabelValue();
    }

    return intl.formatMessage(
      { id: "criterion_modifier.format_string" },
      {
        criterion: intl.formatMessage({ id: this.criterionOption.messageID }),
        modifierString,
        valueString,
      }
    );
  }

  public getId(): string {
    return `${this.criterionOption.parameterName}-${this.modifier.toString()}`; // TODO add values?
  }

  public toJSON() {
    let encodedCriterion;
    if (
      this.modifier === CriterionModifier.IsNull ||
      this.modifier === CriterionModifier.NotNull
    ) {
      encodedCriterion = {
        type: this.criterionOption.type,
        modifier: this.modifier,
      };
    } else {
      encodedCriterion = {
        type: this.criterionOption.type,
        value: this.value,
        modifier: this.modifier,
      };
    }
    return JSON.stringify(encodedCriterion);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public apply(outputFilter: Record<string, any>) {
    // eslint-disable-next-line no-param-reassign
    outputFilter[this.criterionOption.parameterName] = this.toCriterionInput();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected toCriterionInput(): any {
    return {
      value: this.value,
      modifier: this.modifier,
    };
  }
}

export type InputType = "number" | "text" | undefined;

interface ICriterionOptionsParams {
  messageID: string;
  type: CriterionType;
  inputType?: InputType;
  parameterName?: string;
  modifierOptions?: CriterionModifier[];
  defaultModifier?: CriterionModifier;
  options?: Option[];
}
export class CriterionOption {
  public readonly messageID: string;
  public readonly type: CriterionType;
  public readonly parameterName: string;
  public readonly modifierOptions: ILabeledValue[];
  public readonly defaultModifier: CriterionModifier;
  public readonly options: Option[] | undefined;
  public readonly inputType: InputType;

  constructor(options: ICriterionOptionsParams) {
    this.messageID = options.messageID;
    this.type = options.type;
    this.parameterName = options.parameterName ?? options.type;
    this.modifierOptions = (options.modifierOptions ?? []).map((o) =>
      Criterion.getModifierOption(o)
    );
    this.defaultModifier = options.defaultModifier ?? CriterionModifier.Equals;
    this.options = options.options;
    this.inputType = options.inputType;
  }
}

export class StringCriterionOption extends CriterionOption {
  constructor(
    messageID: string,
    value: CriterionType,
    parameterName?: string,
    options?: Option[]
  ) {
    super({
      messageID,
      type: value,
      parameterName,
      modifierOptions: [
        CriterionModifier.Equals,
        CriterionModifier.NotEquals,
        CriterionModifier.Includes,
        CriterionModifier.Excludes,
        CriterionModifier.IsNull,
        CriterionModifier.NotNull,
        CriterionModifier.MatchesRegex,
        CriterionModifier.NotMatchesRegex,
      ],
      defaultModifier: CriterionModifier.Equals,
      options,
      inputType: "text",
    });
  }
}

export function createStringCriterionOption(
  value: CriterionType,
  messageID?: string,
  parameterName?: string
) {
  return new StringCriterionOption(
    messageID ?? value,
    value,
    parameterName ?? messageID ?? value
  );
}

export class StringCriterion extends Criterion<string> {
  constructor(type: CriterionOption) {
    super(type, "");
  }

  public getLabelValue() {
    return this.value;
  }
}

export class IStringCriterionOption extends CriterionOption {
  constructor(
    messageID: string,
    value: CriterionType,
    parameterName?: string,
    options?: Option[]
  ) {
    super({
      messageID,
      type: value,
      parameterName,
      modifierOptions: [
        CriterionModifier.Equals,
        CriterionModifier.NotEquals,
        CriterionModifier.Includes,
        CriterionModifier.Excludes,
        CriterionModifier.IsNull,
        CriterionModifier.NotNull,
        CriterionModifier.MatchesRegex,
        CriterionModifier.NotMatchesRegex,
        CriterionModifier.Between,
        CriterionModifier.NotBetween,
        CriterionModifier.GreaterThan,
        CriterionModifier.LessThan
      ],
      defaultModifier: CriterionModifier.Equals,
      options,
      inputType: "text",
    });
  }
}

export function createIStringCriterionOption(
  value: CriterionType,
  messageID?: string,
  parameterName?: string
) {
  return new IStringCriterionOption(
    messageID ?? value,
    value,
    parameterName ?? messageID ?? value
  );
}

export class IStringCriterion extends Criterion<IStringValue> {
  public get value(): IStringValue {
    return this._value;
  }
  public set value(value: IStringValue) {
    this._value = value;
  }
  protected toCriterionInput(): StringCriterionInput {
    return {
      modifier: this.modifier,
      value: this.value.value,
      value2: this.value.value2,
    };
  }
  public getLabelValue() {
    const { value, value2 } = this.value;
    if (
      this.modifier === CriterionModifier.Between ||
      this.modifier === CriterionModifier.NotBetween
    ) {
      return `${value}, ${value2 ?? ""}`;
    } else {
      return `${value}`;
    }
  }
  constructor(type: CriterionOption) {
    super(type, { value: "", value2: undefined });
  }
}

export class MandatoryStringCriterionOption extends CriterionOption {
  constructor(
    messageID: string,
    value: CriterionType,
    parameterName?: string,
    options?: Option[]
  ) {
    super({
      messageID,
      type: value,
      parameterName,
      modifierOptions: [
        CriterionModifier.Equals,
        CriterionModifier.NotEquals,
        CriterionModifier.Includes,
        CriterionModifier.Excludes,
        CriterionModifier.MatchesRegex,
        CriterionModifier.NotMatchesRegex,
      ],
      defaultModifier: CriterionModifier.Equals,
      options,
      inputType: "text",
    });
  }
}

export function createMandatoryStringCriterionOption(
  value: CriterionType,
  messageID?: string,
  parameterName?: string
) {
  return new MandatoryStringCriterionOption(
    messageID ?? value,
    value,
    parameterName ?? messageID ?? value
  );
}

export class BooleanCriterionOption extends CriterionOption {
  constructor(messageID: string, value: CriterionType, parameterName?: string) {
    super({
      messageID,
      type: value,
      parameterName,
      modifierOptions: [],
      defaultModifier: CriterionModifier.Equals,
      options: [true.toString(), false.toString()],
    });
  }
}

export class BooleanCriterion extends StringCriterion {
  protected toCriterionInput(): boolean {
    return this.value === "true";
  }
}

export function createBooleanCriterionOption(
  value: CriterionType,
  messageID?: string,
  parameterName?: string
) {
  return new BooleanCriterionOption(
    messageID ?? value,
    value,
    parameterName ?? messageID ?? value
  );
}

export class NumberCriterionOption extends CriterionOption {
  constructor(
    messageID: string,
    value: CriterionType,
    parameterName?: string,
    options?: Option[]
  ) {
    super({
      messageID,
      type: value,
      parameterName,
      modifierOptions: [
        CriterionModifier.Equals,
        CriterionModifier.NotEquals,
        CriterionModifier.GreaterThan,
        CriterionModifier.LessThan,
        CriterionModifier.IsNull,
        CriterionModifier.NotNull,
        CriterionModifier.Between,
        CriterionModifier.NotBetween,
      ],
      defaultModifier: CriterionModifier.Equals,
      options,
      inputType: "number",
    });
  }
}

export function createNumberCriterionOption(value: CriterionType) {
  return new NumberCriterionOption(value, value, value);
}

export class NumberCriterion extends Criterion<INumberValue> {
  public get value(): INumberValue {
    return this._value;
  }
  public set value(newValue: number | INumberValue) {
    // backwards compatibility - if this.value is a number, use that
    if (typeof newValue !== "object") {
      this._value = {
        value: newValue,
        value2: undefined,
      };
    } else {
      this._value = newValue;
    }
  }

  protected toCriterionInput(): IntCriterionInput {
    return {
      modifier: this.modifier,
      value: this.value.value,
      value2: this.value.value2,
    };
  }

  public getLabelValue() {
    const { value, value2 } = this.value;
    if (
      this.modifier === CriterionModifier.Between ||
      this.modifier === CriterionModifier.NotBetween
    ) {
      return `${value}, ${value2 ?? 0}`;
    } else {
      return `${value}`;
    }
  }

  constructor(type: CriterionOption) {
    super(type, { value: 0, value2: undefined });
  }
}

export class ILabeledIdCriterionOption extends CriterionOption {
  constructor(
    messageID: string,
    value: CriterionType,
    parameterName: string,
    includeAll: boolean
  ) {
    const modifierOptions = [
      CriterionModifier.Includes,
      CriterionModifier.Excludes,
      CriterionModifier.IsNull,
      CriterionModifier.NotNull,
    ];

    let defaultModifier = CriterionModifier.Includes;
    if (includeAll) {
      modifierOptions.unshift(CriterionModifier.IncludesAll);
      defaultModifier = CriterionModifier.IncludesAll;
    }

    super({
      messageID,
      type: value,
      parameterName,
      modifierOptions,
      defaultModifier,
    });
  }
}

export class ILabeledIdCriterion extends Criterion<ILabeledId[]> {
  public getLabelValue(): string {
    return this.value.map((v) => v.label).join(", ");
  }

  protected toCriterionInput(): MultiCriterionInput {
    return {
      value: this.value.map((v) => v.id),
      modifier: this.modifier,
    };
  }

  constructor(type: CriterionOption) {
    super(type, []);
  }
}

export class IHierarchicalLabeledIdCriterion extends Criterion<IHierarchicalLabelValue> {
  protected toCriterionInput(): HierarchicalMultiCriterionInput {
    return {
      value: (this.value.items ?? []).map((v) => v.id),
      modifier: this.modifier,
      depth: this.value.depth,
    };
  }

  public getLabelValue(): string {
    const labels = (this.value.items ?? []).map((v) => v.label).join(", ");

    if (this.value.depth === 0) {
      return labels;
    }

    return `${labels} (+${this.value.depth > 0 ? this.value.depth : "all"})`;
  }

  constructor(type: CriterionOption) {
    const value: IHierarchicalLabelValue = {
      items: [],
      depth: 0,
    };

    super(type, value);
  }
}

export class MandatoryNumberCriterionOption extends CriterionOption {
  constructor(messageID: string, value: CriterionType, parameterName?: string) {
    super({
      messageID,
      type: value,
      parameterName,
      modifierOptions: [
        CriterionModifier.Equals,
        CriterionModifier.NotEquals,
        CriterionModifier.GreaterThan,
        CriterionModifier.LessThan,
        CriterionModifier.Between,
        CriterionModifier.NotBetween,
      ],
      defaultModifier: CriterionModifier.Equals,
      inputType: "number",
    });
  }
}

export function createMandatoryNumberCriterionOption(
  value: CriterionType,
  messageID?: string
) {
  return new MandatoryNumberCriterionOption(messageID ?? value, value, value);
}

export class DurationCriterion extends Criterion<INumberValue> {
  constructor(type: CriterionOption) {
    super(type, { value: 0, value2: undefined });
  }

  protected toCriterionInput(): IntCriterionInput {
    return {
      modifier: this.modifier,
      value: this.value.value,
      value2: this.value.value2,
    };
  }

  public getLabelValue() {
    return this.modifier === CriterionModifier.Between ||
      this.modifier === CriterionModifier.NotBetween
      ? `${DurationUtils.secondsToString(
          this.value.value
        )} ${DurationUtils.secondsToString(this.value.value2 ?? 0)}`
      : this.modifier === CriterionModifier.GreaterThan ||
        this.modifier === CriterionModifier.LessThan ||
        this.modifier === CriterionModifier.Equals ||
        this.modifier === CriterionModifier.NotEquals
      ? DurationUtils.secondsToString(this.value.value)
      : "?";
  }
}

export class PhashDuplicateCriterion extends StringCriterion {
  protected toCriterionInput(): PHashDuplicationCriterionInput {
    return {
      duplicated: this.value === "true",
    };
  }
}

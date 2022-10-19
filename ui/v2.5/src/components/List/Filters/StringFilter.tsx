import React, { useRef } from "react";
import { Form } from "react-bootstrap";
import { useIntl } from "react-intl";
import { IStringValue } from "src/models/list-filter/types";
import { CriterionModifier } from "../../../core/generated-graphql";
import {
  Criterion,
} from "../../../models/list-filter/criteria/criterion";

interface IInputFilterProps {
  criterion: Criterion<IStringValue>;
  onValueChanged: (value: IStringValue) => void;
}

export const StringFilter: React.FC<IInputFilterProps> = ({
  criterion,
  onValueChanged,
}) => {
  const intl = useIntl();

  const valueStage = useRef<IStringValue>(criterion.value);

  function onChanged(
    event: React.ChangeEvent<HTMLInputElement>,
    property: "value" | "value2"
  ) {
      valueStage.current[property] = event.target.value ? event.target.value.toString() : "";
   }
  
  function onBlurInput() {
    onValueChanged(valueStage.current);
  }

  let equalsControl: JSX.Element | null = null;
  if (
    criterion.modifier === CriterionModifier.Equals ||
    criterion.modifier === CriterionModifier.NotEquals ||
    criterion.modifier === CriterionModifier.Includes ||
    criterion.modifier === CriterionModifier.Excludes ||
    criterion.modifier === CriterionModifier.MatchesRegex ||
    criterion.modifier === CriterionModifier.NotMatchesRegex
  ) {
    equalsControl = (
      <Form.Group>
        <Form.Control
          className="btn-secondary"
          type="string"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChanged(e, "value")
          }
          onBlur={onBlurInput}
          defaultValue={criterion.value?.value ?? ""}
          placeholder={intl.formatMessage({ id: "criterion.value" })}
        />
      </Form.Group>
    );
  }

  let lowerControl: JSX.Element | null = null;
  if (
    criterion.modifier === CriterionModifier.GreaterThan ||
    criterion.modifier === CriterionModifier.Between ||
    criterion.modifier === CriterionModifier.NotBetween
  ) {
    lowerControl = (
      <Form.Group>
        <Form.Control
          className="btn-secondary"
          type="string"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChanged(e, "value")
          }
          onBlur={onBlurInput}
          defaultValue={criterion.value?.value ?? ""}
          placeholder={intl.formatMessage({ id: "criterion.greater_than" })}
        />
      </Form.Group>
    );
  }

  let upperControl: JSX.Element | null = null;
  if (
    criterion.modifier === CriterionModifier.LessThan ||
    criterion.modifier === CriterionModifier.Between ||
    criterion.modifier === CriterionModifier.NotBetween
  ) {
    upperControl = (
      <Form.Group>
        <Form.Control
          className="btn-secondary"
          type="string"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChanged(
              e,
              criterion.modifier === CriterionModifier.LessThan
                ? "value"
                : "value2"
            )
          }
          onBlur={onBlurInput}
          defaultValue={
            (criterion.modifier === CriterionModifier.LessThan
              ? criterion.value?.value
              : criterion.value?.value2) ?? ""
          }
          placeholder={intl.formatMessage({ id: "criterion.less_than" })}
        />
      </Form.Group>
    );
  }

  return (
    <>
      {equalsControl}
      {lowerControl}
      {upperControl}
    </>
  );
};
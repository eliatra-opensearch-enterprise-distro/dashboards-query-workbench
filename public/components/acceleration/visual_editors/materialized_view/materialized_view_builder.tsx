/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiExpression,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  htmlIdGenerator,
} from '@elastic/eui';
import producer from 'immer';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import {
  AggregationFunctionType,
  CreateAccelerationForm,
  MaterializedViewColumn,
} from '../../../../../common/types';
import { hasError, validateMaterializedViewData } from '../../create/utils';
import { AddColumnPopOver } from './add_column_popover';
import { ColumnExpression } from './column_expression';
import { GroupByTumbleExpression } from './group_by_tumble_expression';

interface MaterializedViewBuilderProps {
  accelerationFormData: CreateAccelerationForm;
  setAccelerationFormData: React.Dispatch<React.SetStateAction<CreateAccelerationForm>>;
}

const newColumnExpressionId = htmlIdGenerator()();

export const MaterializedViewBuilder = ({
  accelerationFormData,
  setAccelerationFormData,
}: MaterializedViewBuilderProps) => {
  const [isColumnPopOverOpen, setIsColumnPopOverOpen] = useState(false);
  const [columnExpressionValues, setColumnExpressionValues] = useState<MaterializedViewColumn[]>(
    []
  );

  useEffect(() => {
    if (accelerationFormData.dataTableFields.length > 0) {
      const newColumnExpresionValue = [
        {
          id: newColumnExpressionId,
          functionName: 'count' as AggregationFunctionType,
          functionParam: accelerationFormData.dataTableFields[0].fieldName,
          fieldAlias: 'counter1',
        },
      ];
      setAccelerationFormData(
        producer((accData) => {
          accData.materializedViewQueryData.columnsValues = newColumnExpresionValue;
          accData.formErrors.materializedViewError = validateMaterializedViewData(
            accData.accelerationIndexType,
            accData.materializedViewQueryData
          );
        })
      );
      setColumnExpressionValues(newColumnExpresionValue);
    }
  }, [accelerationFormData.dataTableFields]);

  return (
    <>
      <EuiText data-test-subj="covering-index-builder">
        <h3>Materialized view definition</h3>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiExpression
        description="CREATE MATERIALIZED VIEW"
        value={`${accelerationFormData.dataSource}.${accelerationFormData.database}.${accelerationFormData.accelerationIndexName}`}
      />

      <EuiFlexGroup>
        <EuiFlexItem grow={false}>
          <EuiExpression
            color="accent"
            description="AS SELECT"
            value=""
            isInvalid={
              hasError(accelerationFormData.formErrors, 'materializedViewError') &&
              columnExpressionValues.length < 1
            }
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <AddColumnPopOver
            isColumnPopOverOpen={isColumnPopOverOpen}
            setIsColumnPopOverOpen={setIsColumnPopOverOpen}
            columnExpressionValues={columnExpressionValues}
            setColumnExpressionValues={setColumnExpressionValues}
            accelerationFormData={accelerationFormData}
            setAccelerationFormData={setAccelerationFormData}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup direction="column" gutterSize="s">
        {_.map(columnExpressionValues, (_, i) => {
          return (
            <ColumnExpression
              index={i}
              currentColumnExpressionValue={columnExpressionValues[i]}
              columnExpressionValues={columnExpressionValues}
              setColumnExpressionValues={setColumnExpressionValues}
              accelerationFormData={accelerationFormData}
              setAccelerationFormData={setAccelerationFormData}
            />
          );
        })}
      </EuiFlexGroup>
      <EuiSpacer size="s" />
      <EuiExpression
        description="FROM"
        value={`${accelerationFormData.dataSource}.${accelerationFormData.database}.${accelerationFormData.dataTable}`}
      />
      <EuiSpacer size="s" />
      <GroupByTumbleExpression
        accelerationFormData={accelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    </>
  );
};

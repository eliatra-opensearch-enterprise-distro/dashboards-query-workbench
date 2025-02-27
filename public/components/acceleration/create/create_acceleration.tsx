/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiComboBoxOptionOption,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiForm,
  EuiSpacer,
} from '@elastic/eui';
import React, { useState } from 'react';
import { CoreStart } from '../../../../../../src/core/public';
import {
  ACCELERATION_DEFUALT_SKIPPING_INDEX_NAME,
  ACCELERATION_TIME_INTERVAL,
} from '../../../../common/constants';
import { CreateAccelerationForm } from '../../../../common/types';
import { DefineIndexOptions } from '../selectors/define_index_options';
import { IndexSettingOptions } from '../selectors/index_setting_options';
import { AccelerationDataSourceSelector } from '../selectors/source_selector';
import { accelerationQueryBuilder } from '../visual_editors/query_builder';
import { QueryVisualEditor } from '../visual_editors/query_visual_editor';
import { CreateAccelerationHeader } from './create_acceleration_header';
import { formValidator, hasError } from './utils';

export interface CreateAccelerationProps {
  http: CoreStart['http'];
  selectedDatasource: EuiComboBoxOptionOption[];
  resetFlyout: () => void;
  updateQueries: (query: string) => void;
}

export const CreateAcceleration = ({
  http,
  selectedDatasource,
  resetFlyout,
  updateQueries,
}: CreateAccelerationProps) => {
  const [accelerationFormData, setAccelerationFormData] = useState<CreateAccelerationForm>({
    dataSource: selectedDatasource.length > 0 ? selectedDatasource[0].label : '',
    dataTable: '',
    database: '',
    dataTableFields: [],
    accelerationIndexType: 'skipping',
    skippingIndexQueryData: [],
    coveringIndexQueryData: [],
    materializedViewQueryData: {
      columnsValues: [],
      groupByTumbleValue: {
        timeField: '',
        tumbleWindow: 0,
        tumbleInterval: '',
      },
    },
    accelerationIndexName: ACCELERATION_DEFUALT_SKIPPING_INDEX_NAME,
    primaryShardsCount: 1,
    replicaShardsCount: 1,
    refreshType: 'auto',
    checkpointLocation: undefined,
    refreshIntervalOptions: {
      refreshWindow: 1,
      refreshInterval: ACCELERATION_TIME_INTERVAL[1].value,
    },
    formErrors: {
      dataSourceError: [],
      databaseError: [],
      dataTableError: [],
      skippingIndexError: [],
      coveringIndexError: [],
      materializedViewError: [],
      indexNameError: [],
      primaryShardsError: [],
      replicaShardsError: [],
      refreshIntervalError: [],
      checkpointLocationError: [],
    },
  });

  const copyToEditor = () => {
    const errors = formValidator(accelerationFormData);
    if (hasError(errors)) {
      setAccelerationFormData({ ...accelerationFormData, formErrors: errors });
      return;
    }
    updateQueries(accelerationQueryBuilder(accelerationFormData));
    resetFlyout();
  };

  return (
    <>
      <EuiFlyout ownFocus onClose={resetFlyout} aria-labelledby="flyoutTitle" size="m">
        <EuiFlyoutHeader hasBorder>
          <CreateAccelerationHeader />
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiSpacer size="l" />
          <EuiForm
            isInvalid={hasError(accelerationFormData.formErrors)}
            error={Object.values(accelerationFormData.formErrors).flat()}
            component="div"
            id="acceleration-form"
          >
            <AccelerationDataSourceSelector
              http={http}
              accelerationFormData={accelerationFormData}
              setAccelerationFormData={setAccelerationFormData}
              selectedDatasource={selectedDatasource}
            />
            <EuiSpacer size="xxl" />
            <IndexSettingOptions
              http={http}
              accelerationFormData={accelerationFormData}
              setAccelerationFormData={setAccelerationFormData}
            />
            <EuiSpacer size="xxl" />
            <DefineIndexOptions
              accelerationFormData={accelerationFormData}
              setAccelerationFormData={setAccelerationFormData}
            />
            <EuiSpacer size="m" />
            <QueryVisualEditor
              accelerationFormData={accelerationFormData}
              setAccelerationFormData={setAccelerationFormData}
            />
          </EuiForm>
        </EuiFlyoutBody>
        <EuiFlyoutFooter>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty iconType="cross" onClick={resetFlyout} flush="left">
                Close
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton onClick={copyToEditor} fill>
                Copy Query to Editor
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      </EuiFlyout>
    </>
  );
};

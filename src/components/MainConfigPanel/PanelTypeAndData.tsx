import './index.scss'
import {useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button, Divider, Input, Select, Dropdown, Tag} from '@douyinfe/semi-ui';
import Icon, {IconDeleteStroked, IconPlus} from '@douyinfe/semi-icons';
import type {ICategory} from '@lark-base-open/js-sdk';
import {base, dashboard, IDataRange, Rollup, SourceType} from "@lark-base-open/js-sdk";
import {ICustomConfig, ITableItem, MomOrYoy, MomOrYoyCalcMethod, MomOrYoyCalcType, Mutable} from '@/common/type';
import {momOrYoyCalcTypeList} from '@/common/constant';
import {getMomYoyDesc, getNewMomOrYoyCalcMethodList} from '@/utils';
import IconTable from '@/assets/icon_table.svg?react';
import IconNumber from '@/assets/icon_number.svg?react';

interface IProps {
  config: ICustomConfig;
  datasourceRange: IDataRange[];
  setConfig: (data: ICustomConfig) => void;
  tableList: ITableItem[];
  tableFields: { id: string, name: string, type: number }[];
  numberOrCurrencyList: ICategory[];
  setData: (config: ICustomConfig, tableIdChange: boolean) => void;
}

export default function PanelTypeAndData({ config, datasourceRange, setConfig, tableList, tableFields, numberOrCurrencyList, setData }: IProps) {
  const { t } = useTranslation();

  const [newMomOrYoyCalcMethodList, setNewMomOrYoyCalcMethodList] = useState(getNewMomOrYoyCalcMethodList(config.dateRange));

  const [currentFields, setCurrentFields] = useState<{ id: string, name: string, type: number }[]>(tableFields);
  const [keyIndicatorsFieldId, setKeyIndicatorsFieldId] = useState(config.keyIndicatorsFieldId);
  const [keyIndicatorsFieldIdRollup, setKeyIndicatorsFieldIdRollup] = useState(config.keyIndicatorsRollup ?? Rollup.SUM);

  const methodList: { keyOfName: string, type: Rollup }[] = [
    { keyOfName: 'sum', type: Rollup.SUM },
    { keyOfName: 'average', type: Rollup.AVERAGE },
    { keyOfName: 'max', type: Rollup.MAX },
    { keyOfName: 'min', type: Rollup.MIN },
  ]

  const tableChange = async (tableId: any) => {
    config.tableId = tableId;
    datasourceRange = await dashboard.getTableDataRange(tableId);
    console.log(datasourceRange, 'tableChange-------------')
    const table = await base.getTable(tableId);
    const tableFields = (await table.getFieldMetaList()) as any[]
    console.log(tableFields);
    setCurrentFields(tableFields)
    setKeyIndicatorsFieldId('')
    setData(config, true);
  }

  const datasourceRangeChange = (range: string) => {
    console.log(range)
    config.datasourceRange = range
    console.log(range, 'datasourceRangeChange-------------')
    setData(config, false);
  }

  const handlerChange = (key: string, value: any) => {
    setConfig({ ...config, [key]: value });
  }

  const momOrYoyItemChange = (item: MomOrYoy, key: string, value: any, index: number) => {
    item = { ...item, [key]: value };
    if (key === 'momOrYoyDesc') {
      item.manualSetDesc = true;
    }
    const { manualSetDesc, momOrYoyCalcMethod, momOrYoyCalcType } = item;
    if (!manualSetDesc) {
      item.momOrYoyDesc = getMomYoyDesc(momOrYoyCalcMethod, momOrYoyCalcType);
    }
    config.momOrYoy[index] = item;
    setConfig({ ...config });
  }

  const scrollToBottomRef = useRef<HTMLDivElement>(null);
  const addMomOrYoyItem = () => {
    const item: MomOrYoy = {
      momOrYoyDesc: t('momGrowthRate'),
      momOrYoyFieldId: '',
      manualSetDesc: false,
      momOrYoyCalcMethod: 'mom',
      momOrYoyCalcType: 'differenceRate',
    }
    config.momOrYoy.push(item);
    setConfig({ ...config });
    setTimeout(() => {
      scrollToBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }

  const deleteMomOrYoyItem = (index: number) => {
    config.momOrYoy.splice(index, 1);
    setConfig({ ...config });
  }

  const changeComputeMethod = (value) => {
    config.keyIndicatorsRollup = value
    setConfig(config)
    setKeyIndicatorsFieldIdRollup(value)
  }

  const computeMethodSuffix = () => {
    return (
        <Dropdown
            render={
              <Dropdown.Menu>
                <Dropdown.Item>Menu Item 1</Dropdown.Item>
                <Dropdown.Item>Menu Item 2</Dropdown.Item>
                <Dropdown.Item>Menu Item 3</Dropdown.Item>
              </Dropdown.Menu>
            }
        >
          <Tag>Hover Me</Tag>
        </Dropdown>
    )
  }

  return (
    <div className="form-main">
      <div className="form-title">{t('dataSource')}</div>
      <div className='form-item'>
        <Select
          prefix={<Icon svg={<IconTable />} />}
          optionList={tableList as Mutable<typeof tableList>}
          value={config.tableId} onChange={tableChange}>
        </Select>
      </div>
      <div className="form-title">{t('dataRange')}</div>
      <div className='form-item'>
        <Select
            prefix={<Icon svg={<IconTable />} />}
            optionList={datasourceRange.map(item => {
              if (item.type === SourceType.ALL) {
                return {
                  value: 'All',
                  label: t('view_all'),
                };
              } else {
                return {
                  value: item.viewId,
                  label: item.viewName,
                };
              }
            })}
            value={config.datasourceRange} onChange={datasourceRangeChange}>
        </Select>
      </div>
      <Divider style={{ borderColor: 'var(--divider)', margin: '20px 0 20px 0' }} />

      <div className="form-title">{t('key_indicators')}</div>
      <div className='form-item'>
        <Select
            placeholder={t('key_indicators')}
            prefix={<Icon svg={<IconNumber />} />}
            suffix={computeMethodSuffix}
            value={config.keyIndicatorsFieldId}
            onChange={(value) => { handlerChange('keyIndicatorsFieldId', value) }}
            optionList={currentFields.map(item => {
              return {
                value: item.id,
                label: item.name,
                disabled: item.type !== 2
              };
          })}
        >
        </Select>
      </div>

      <div className="form-title">
        <span>{t('auxiliary_index')}</span>
        <Button
          disabled={config.momOrYoy.length >= 4}
          theme='borderless'
          icon={<IconPlus size='small' />}
          style={{ fontWeight: 'normal' }}
          onClick={addMomOrYoyItem}>
          {t('add_index')}
        </Button>
      </div>
      {
        (config.momOrYoy ?? []).map((item, index) => (
          <div className='form-item bg-grey' key={index}>
            {config.momOrYoy.length > 1 && (
              <div className='icon-delete' onClick={() => { deleteMomOrYoyItem(index) }}>
                <IconDeleteStroked size='small' />
              </div>
            )}
            <div className='form-subTitle'>{t('field')}</div>
            {/*momOrYoyCalcMethod*/}
            <Select
              position='top'
              value={item.momOrYoyFieldId}
              onChange={(value) =>  momOrYoyItemChange(item, 'momOrYoyFieldId', value, index)}
              optionList={currentFields.map(item => {
                return {
                  value: item.id,
                  label: item.name,
                  disabled: item.type !== 2
                };
              })}
            >
            </Select>

            <div className='form-subTitle'>{t('description')}</div>
            <Input
                value={item.momOrYoyDesc}
                onChange={(value) =>  momOrYoyItemChange(item, 'momOrYoyDesc', value, index)} />

            <div className='form-subTitle'>{t('calculationType')}</div>
            <Select
              position='top'
              optionList={momOrYoyCalcTypeList as Mutable<typeof momOrYoyCalcTypeList>}
              value={item.momOrYoyCalcType}
              onChange={(value) => momOrYoyItemChange(item, 'momOrYoyCalcType', value, index)}>
            </Select>
            <div ref={scrollToBottomRef}></div>
          </div>
        ))
      }
    </div>
  )
}

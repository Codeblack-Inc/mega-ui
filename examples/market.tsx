import { useEffect, useRef, useState } from 'react';
import {
  Amount,
  Input,
  Avatar,
  Badge,
  Banner,
  Button,
  Chip,
  Dialog,
  EmptyState,
  Heading,
  IconButton,
  ListRow,
  Separator,
  Sparkline,
  Stack,
  Stat,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  Text,
  Tooltip,
  TopBar,
  TopBarLink,
} from '@mega-ui/react';
import { ExampleIcon } from './icons';

const stocks = [
  {
    name: '윙입푸드(ADR)',
    symbol: 'WYHG',
    price: 6968,
    change: 27.83,
    turnover: 439,
    volume: 630,
    region: '해외',
    color: '#ba303c',
  },
  {
    name: 'SOXL',
    symbol: 'SOXL',
    price: 166093,
    change: 5.48,
    turnover: 339,
    volume: 204,
    region: '해외',
    color: '#e48b17',
  },
  {
    name: '삼성전자',
    symbol: '005930',
    price: 72800,
    change: -1.22,
    turnover: 286,
    volume: 393,
    region: '국내',
    color: '#2867c7',
  },
  {
    name: '엔비디아',
    symbol: 'NVDA',
    price: 245680,
    change: 3.24,
    turnover: 241,
    volume: 98,
    region: '해외',
    color: '#629323',
  },
  {
    name: 'SK하이닉스',
    symbol: '000660',
    price: 198500,
    change: 2.85,
    turnover: 218,
    volume: 110,
    region: '국내',
    color: '#ca4641',
  },
  {
    name: 'SOXS',
    symbol: 'SOXS',
    price: 59154,
    change: -4.92,
    turnover: 190,
    volume: 321,
    region: '해외',
    color: '#d99124',
  },
  {
    name: '아이온큐',
    symbol: 'IONQ',
    price: 56684,
    change: 6.83,
    turnover: 169,
    volume: 298,
    region: '해외',
    color: '#7055b8',
  },
  {
    name: '한전기술',
    symbol: '052690',
    price: 145000,
    change: 18.56,
    turnover: 148,
    volume: 102,
    region: '국내',
    color: '#d5433a',
  },
  {
    name: '리게티 컴퓨팅',
    symbol: 'RGTI',
    price: 22099,
    change: 8.28,
    turnover: 129,
    volume: 584,
    region: '해외',
    color: '#009d9a',
  },
  {
    name: '테슬라',
    symbol: 'TSLA',
    price: 462380,
    change: -2.13,
    turnover: 118,
    volume: 26,
    region: '해외',
    color: '#ce3947',
  },
  {
    name: '애플',
    symbol: 'AAPL',
    price: 318240,
    change: 0.82,
    turnover: 96,
    volume: 30,
    region: '해외',
    color: '#737c89',
  },
  {
    name: 'NAVER',
    symbol: '035420',
    price: 234500,
    change: 1.52,
    turnover: 84,
    volume: 36,
    region: '국내',
    color: '#159451',
  },
];

export function MarketExample() {
  const [tab, setTab] = useState('chart');
  const [region, setRegion] = useState('전체');
  const [sort, setSort] = useState('거래대금');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<(typeof stocks)[number] | null>(
    null,
  );
  const [info, setInfo] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== '/' ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (event.target instanceof HTMLElement &&
          event.target.closest(
            'input, textarea, select, [contenteditable="true"], dialog',
          ))
      )
        return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  const ranked = stocks
    .filter(
      (stock) =>
        (region === '전체' || region === stock.region) &&
        `${stock.name} ${stock.symbol}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === '급상승'
        ? b.change - a.change
        : sort === '급하락'
          ? a.change - b.change
          : sort === '거래량'
            ? b.volume - a.volume
            : b.turnover - a.turnover,
    );
  return (
    <div className="market-layout">
      <TopBar
        className="market-topbar"
        brand={
          <span className="market-brand">
            <span className="market-brand__symbol">m</span>메가증권
          </span>
        }
        actions={
          <>
            <Input
              ref={searchRef}
              size="sm"
              aria-label="종목 검색"
              placeholder="/ 를 눌러 검색하세요"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setTab('chart');
              }}
            />
            <Button size="sm" onClick={() => setInfo('로그인')}>
              로그인
            </Button>
          </>
        }
      >
        {['홈', '피드', '주식 골라보기', '내 계좌'].map((label, index) => (
          <TopBarLink
            href="#market"
            key={label}
            active={index === 0}
            onClick={(event) => {
              event.preventDefault();
              if (index === 0) {
                setTab('chart');
                setQuery('');
              } else setInfo(label);
            }}
          >
            {label}
          </TopBarLink>
        ))}
      </TopBar>
      <div className="market-main">
        <Banner
          className="market-announcement"
          tone="warning"
          icon={<ExampleIcon name="bell" />}
          title="9월 19일 서비스 점검 안내"
          description="오전 2시부터 6시까지 주문이 잠시 멈춰요"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setInfo('9월 19일 서비스 점검 안내')}
            >
              자세히 보기
            </Button>
          }
        />
        <section className="market-board" aria-label="시장 현황과 실시간 순위">
          <div className="market-session">
            <Stack direction="row" gap={4} wrap>
              <Text size="xs" tone="muted">
                ● 국내 장 닫힘
              </Text>
              <Text size="xs">
                <span className="market-live-dot" /> 해외 프리마켓{' '}
                <span className="market-session__time">17:00 – 22:30</span>
              </Text>
            </Stack>
            <Badge tone="teal">시장 미리보기</Badge>
          </div>
          <div className="market-indices">
            {[
              {
                label: '나스닥',
                value: '26,506.99',
                delta: '−77.07 (0.28%)',
                direction: 'down',
              },
              {
                label: 'S&P 500',
                value: '7,718.60',
                delta: '−29.11 (0.37%)',
                direction: 'down',
              },
              {
                label: '달러 환율',
                value: '1,344.85',
                delta: '+2.25 (0.16%)',
                direction: 'up',
              },
              {
                label: 'VIX',
                value: '15.55',
                delta: '+0.25 (1.63%)',
                direction: 'up',
              },
            ].map((index) => (
              <div key={index.label} className="market-index">
                <Stat
                  label={index.label}
                  value={index.value}
                  size="sm"
                  delta={{
                    value: index.delta,
                    direction: index.direction as 'up' | 'down',
                  }}
                />
                <Sparkline
                  className="market-spark"
                  values={
                    index.direction === 'up'
                      ? [8, 12, 10, 18, 15, 21, 19, 28]
                      : [28, 24, 26, 19, 21, 15, 17, 11]
                  }
                  direction={index.direction as 'up' | 'down'}
                />
              </div>
            ))}
          </div>
          <div className="market-tabs">
            <Tabs
              label="시장 정보"
              variant="underline"
              value={tab}
              onValueChange={setTab}
              items={[
                { value: 'chart', label: '실시간 차트' },
                { value: 'industry', label: '지금 뜨는 산업' },
                { value: 'investors', label: '외국인·기관 매매 동향' },
              ]}
            />
          </div>
          {tab === 'chart' ? (
            <div role="tabpanel" aria-label="실시간 차트">
              <div className="market-filters">
                <Stack
                  direction="row"
                  gap={1}
                  role="group"
                  aria-label="거래 시장"
                >
                  {['전체', '국내', '해외'].map((label) => (
                    <Chip
                      size="sm"
                      key={label}
                      selected={region === label}
                      onClick={() => setRegion(label)}
                    >
                      {label}
                    </Chip>
                  ))}
                </Stack>
                <Separator variant="vertical" />
                <Stack
                  direction="row"
                  gap={1}
                  wrap
                  role="group"
                  aria-label="순위 기준"
                >
                  {['거래대금', '거래량', '급상승', '급하락'].map((label) => (
                    <Chip
                      size="sm"
                      key={label}
                      selected={sort === label}
                      onClick={() => setSort(label)}
                    >
                      {label}
                    </Chip>
                  ))}
                </Stack>
              </div>
              <div className="market-ranking-label">
                <Text size="xs" tone="muted">
                  순위 · 오늘 21:38 기준
                </Text>
                <Tooltip content="예제 데이터로 구성한 순위예요. 실제 시세와 다를 수 있어요.">
                  <IconButton label="순위 기준 안내" size="sm">
                    ?
                  </IconButton>
                </Tooltip>
              </div>
              <div className="market-table-scroll">
                <Table
                  zebra={false}
                  className="market-table"
                  aria-label="실시간 종목 순위"
                >
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>순위</TableHeaderCell>
                      <TableHeaderCell>종목</TableHeaderCell>
                      <TableHeaderCell align="end">현재가</TableHeaderCell>
                      <TableHeaderCell align="end">등락률</TableHeaderCell>
                      <TableHeaderCell align="end" className="market-turnover">
                        거래대금
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ranked.length ? (
                      ranked.map((stock, index) => (
                        <TableRow
                          key={stock.symbol}
                          clickable
                          onClick={() => setSelected(stock)}
                        >
                          <TableCell className="market-rank">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="market-stock-name">
                              <Avatar
                                name={stock.name}
                                size="sm"
                                shape="rounded"
                                style={{
                                  background: stock.color,
                                  color: '#fff',
                                }}
                              />
                              <span>
                                {stock.name}
                                <span className="market-stock-symbol">
                                  {stock.symbol} · {stock.region}
                                </span>
                              </span>
                            </div>
                          </TableCell>
                          <TableCell numeric>
                            <Amount value={stock.price} size="sm" />
                          </TableCell>
                          <TableCell
                            numeric
                            tone={stock.change > 0 ? 'up' : 'down'}
                          >
                            {stock.change > 0 ? '+' : ''}
                            {stock.change.toFixed(2)}%
                          </TableCell>
                          <TableCell
                            numeric
                            tone="muted"
                            className="market-turnover"
                          >
                            {stock.turnover}억원
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableEmpty colSpan={5}>
                        검색 결과가 없어요. 다른 종목 이름을 입력해 주세요.
                      </TableEmpty>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : tab === 'industry' ? (
            <div
              role="tabpanel"
              aria-label="지금 뜨는 산업"
              className="market-industries"
            >
              {[
                {
                  name: '반도체',
                  change: 3.37,
                  description: '엔비디아 · 삼성전자 · SK하이닉스',
                },
                {
                  name: '양자 컴퓨팅',
                  change: 7.56,
                  description: '아이온큐 · 리게티 컴퓨팅',
                },
                { name: '전기차', change: -2.13, description: '테슬라' },
              ].map((industry) => (
                <ListRow
                  key={industry.name}
                  title={industry.name}
                  description={industry.description}
                  leading={<Avatar name={industry.name} />}
                  trailing={
                    <Amount
                      value={industry.change}
                      currency="%"
                      signed
                      tone="auto"
                    />
                  }
                />
              ))}
            </div>
          ) : (
            <div role="tabpanel" aria-label="외국인·기관 매매 동향">
              <EmptyState
                icon={<ExampleIcon name="chart" />}
                title="오늘의 매매 동향을 준비하고 있어요"
                description="국내 장 마감 후 집계가 완료되면 알려드릴게요."
                action={
                  <Button variant="weak" onClick={() => setTab('chart')}>
                    실시간 순위 보기
                  </Button>
                }
              />
            </div>
          )}
        </section>
        <div className="market-ticker">
          <Text size="xs" tone="muted">
            시장 요약
          </Text>
          <span>
            필라델피아 반도체{' '}
            <Amount value={3.37} currency="%" signed tone="auto" size="sm" />
          </span>
          <span>
            코스피{' '}
            <Amount value={-0.58} currency="%" signed tone="auto" size="sm" />
          </span>
          <span>
            코스닥{' '}
            <Amount value={-1.25} currency="%" signed tone="auto" size="sm" />
          </span>
        </div>
      </div>
      <aside className="market-watchlist">
        <div className="market-watchlist__heading">
          <Heading size="sm">관심</Heading>
          <Text size="xs" tone="muted">
            단위: 원
          </Text>
        </div>
        <div className="market-ai">
          <Text size="sm" weight="semibold" tone="brand">
            ✦ 오늘의 시장 한마디
          </Text>
          <Text size="sm" tone="secondary">
            반도체와 양자 컴퓨팅에 관심이 모이고 있어요
          </Text>
        </div>
        <Heading size="sm">관심 주식 TOP 10</Heading>
        <Text size="xs" tone="muted">
          지금 많이 지켜보는 종목이에요
        </Text>
        {stocks.slice(0, 10).map((stock) => (
          <ListRow
            key={stock.symbol}
            title={stock.name}
            leading={
              <Avatar
                name={stock.name}
                shape="rounded"
                size="sm"
                style={{ background: stock.color, color: '#fff' }}
              />
            }
            trailing={
              <button
                className="market-watch-price"
                aria-label={`${stock.name} 상세 보기`}
                onClick={() => setSelected(stock)}
              >
                <Amount value={stock.price} />
                <Amount
                  value={stock.change}
                  currency="%"
                  signed
                  tone="auto"
                  size="sm"
                />
              </button>
            }
          />
        ))}
        <Button
          variant="secondary"
          fullWidth
          leading={<ExampleIcon name="heart" />}
          onClick={() => setInfo('관심 종목 추가')}
        >
          관심 종목 추가하기
        </Button>
      </aside>
      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        description={
          selected ? `${selected.symbol} · ${selected.region} 주식` : undefined
        }
        size="sm"
        actions={<Button onClick={() => setSelected(null)}>확인</Button>}
      >
        {selected ? (
          <Stack gap={3}>
            <Amount value={selected.price} size="xl" />
            <Amount value={selected.change} signed currency="%" tone="auto" />
            <Separator />
            <ListRow
              title="거래대금"
              trailing={<Text numeric>{selected.turnover}억원</Text>}
            />
            <ListRow
              title="거래량"
              trailing={<Text numeric>{selected.volume}만주</Text>}
            />
          </Stack>
        ) : null}
      </Dialog>
      <Dialog
        open={info !== null}
        onClose={() => setInfo(null)}
        title={info ?? ''}
        description={
          info?.includes('점검')
            ? '9월 19일 오전 2시부터 6시까지 서비스 점검이 예정되어 있어요.'
            : '계좌와 관심 종목은 로그인 후 이용할 수 있어요. 지금은 예제 화면을 둘러보세요.'
        }
        size="sm"
        actions={<Button onClick={() => setInfo(null)}>확인했어요</Button>}
      />
    </div>
  );
}

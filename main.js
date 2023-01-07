const parseNA=string=>(string =='NA'?undefined:string);
const parseNone=string=>(string =='--'?0:string);
const parseDate=string=>d3.timeParse('%Y%m%d')(string);



function type(d){
    const 日期=parseDate(+d.出表日期+19110000);
    return {
        出表日期:日期,
        年度:+d.年度+1911,
        季別:+d.季別,
        公司代號:+d.公司代號,
        公司名稱:parseNA(d.公司名稱),
        產業別:parseNA(d.產業別),
        基本每股盈餘:+d.基本每股盈餘,
        普通股每股面額:+d.普通股每股面額,
        營業收入:+d.營業收入,
        營業利益:parseNone(d.營業利益),
        營業外收入及支出:parseNone(d.營業外收入及支出),
        稅後淨利:+d.稅後淨利,
    }
}

function filterData(data){
    //debugger;
    return data.filter(
        d=>{
            return(
                d.基本每股盈餘 > -100 && d.營業收入 > 0 &&
                d.公司代號 && d.公司名稱 && d.產業別
            );
        }
    );
}



function setupCanvas(barchartdata,financeClean){
    let metric = '營業收入';

    function click(){
        // debugger;
        metric = this.dataset.name;
        const thisData = chooseData(metric, financeClean);
        update(thisData);
    }

    d3.selectAll('button').on('click',click);

    function update(data){
        console.log(data);
        //Update Scale
        xMax = d3.sum(data, d=>d[metric]/4);
        xScale_v3 = d3.scaleLinear([0, xMax],[0, chart_width]);

        yScale = d3.scaleBand().domain(data.map(d=>d.產業別))
        .rangeRound([0, chart_height]).paddingInner(0.25);

        //Transition Settings
        const defaultDelay = 1000;
        const transitionDelay = d3.transition().duration(defaultDelay);

        //Update axis
        xAxisDraw.transition(transitionDelay).call(xAxis.scale(xScale_v3));
        yAxisDraw.transition(transitionDelay).call(yAxis.scale(yScale));

        //Update Header
        header.select('tspan').text(`全台上市公司${metric} in $TWD`);

        //Update Bar
        bars.selectAll('.bar').data(data, d=>d.產業別).join(
            enter => {
                enter.append('rect').attr('class', 'bar')
                .attr('x',0).attr('y',d=>yScale(d.產業別))
                .attr('height',yScale.bandwidth())
                .style('fill','lightcyan')
                .transition(transitionDelay)
                .delay((d,i)=>i*20)
                .attr('width',d=>xScale_v3(d[metric]))
                .style('fill','dodgerblue');
            },
            update => {
                update.transition(transitionDelay)
                .delay((d,i)=>i*20)
                .attr('y',d=>yScale(d.產業別))
                .attr('width',d=>xScale_v3(d[metric]));
            },
            exit => {
                exit.transition().duration(defaultDelay/2)
                .style('fill-opacity',0)
                .remove();
            }
        );

        //add event listenser
        d3.selectAll('.bar')
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);

    
    }

    const svg_width = 900;
    const svg_height = 900;
    const chart_margin = {top:140,right:40,bottom:30,left:100}
    const chart_width = svg_width - (chart_margin.left + chart_margin.right) ;
    const chart_height = svg_width - (chart_margin.top + chart_margin.bottom) ;

    const this_svg = d3.select('.bar-chart-container').append('svg')
    .attr('width',svg_width).attr('height',svg_height).append('g')
    .attr('transform',`translate(${chart_margin.left},${chart_margin.top})`);

    const xExtent = d3.extent(barchartdata, d=> d.營業收入);
    const xScale_v1 = d3.scaleLinear().domain(xExtent).range([0, chart_width]);
    //scale
    //V2.0 ~ max
    let xMax = d3.max(barchartdata, d=>d.營業收入);
    const xScale_v2 =d3.scaleLinear().domain([0, xMax]).range([0,chart_width]);
    let xScale_v3 = d3.scaleLinear([0, xMax], [0, chart_width]);
    //y
    let yScale = d3.scaleBand().domain(barchartdata.map(d=>d.產業別))
        .rangeRound([0, chart_height])
            .paddingInner(0.25);

    //Draw bars
    //const bars =this_svg.selectAll('.bar')
                    //.data(barchartdata)
                    //.enter().append('rect')
                    //.attr('class','bar')
                    //.attr('x',0)
                    // .attr('y',d=>yScale(d.產業別))
                    // .attr('width',d=>xScale_v2(d.稅後淨利))
                    // .attr('height',yScale.bandwidth())
                    // .style('fill','dodgerblue')
    const bars = this_svg.append('g').attr('class', 'bars');
    //Draw header
    let header =this_svg.append('g').attr('class','bar-header')
                        .attr('transform',`translate(0,${-chart_margin.top/2})`)
                        .append('text');
    header.append('tspan').text('上市公司各產業平均稅後淨利')
        .style('font-size','1.2em');
    header.append('tspan').text(' 2022 第三季')
        .attr('x',0).attr('y',20).style('font-size','0.8em').style('fill','#555');
    //tickSizeInner: the length of the tick lines
    //tickSizeOuter: the length of the square ends of the domain path
    let xAxis=d3.axisTop(xScale_v3)
                .tickFormat(formatTicks)
                .tickSizeInner(-chart_height)
                .tickSizeOuter(0);
    let xAxisDraw=this_svg.append('g')
                        .attr('class','x axis')
                        
    let yAxis=d3.axisLeft(yScale).tickSize(0);
    let yAxisDraw=this_svg.append('g')
    .attr('class', 'y axis');
                            
    yAxisDraw.selectAll('text').attr('dx','-0.6em');

update(barchartdata);

//interactive
const tip = d3.select('.tooltip');
//e -> event
function mouseover(e){
    // debugger;
    // alert("hi");
    //get data
    const thisBarData = d3.select(this).data()[0];
    // debugger;
    const bodyData = [
        ['基本每股盈餘', thisBarData.基本每股盈餘],
        ['營業收入', thisBarData.營業收入],
        ['營業利益', thisBarData.營業利益 ],
        ['稅後淨利', Math.round(thisBarData.稅後淨利)],
        ['營業外收入及支出', thisBarData.營業外收入及支出],
    ];

    // debugger;
    tip.style('left',(e.clientX+15)+'px')
       .style('top',e.clientY+'px')
       .transition()
       .style('opacity',0.98);
    
    //show this data
    tip.select('h3').html(`${thisBarData.公司名稱}`);
    tip.select('h4').html(`${thisBarData.產業別}`);

    d3.select('.tip-body').selectAll('p').data(bodyData)
    .join('p').attr('class','tip-info').html(d => `${d[0]} : ${d[1]}`);

}

function mousemove(e) {
    tip.style('left', (e.clientX+15) + 'px')
        .style('top', e.clientY + 'px');
}

function mouseout(e) {
    tip.transition()
    .style('opacity', 0);
}

d3.selectAll('.bar')
    .on('mouseover', mouseover)
    .on('mousemove', mousemove)
    .on('mouseout', mouseout);


}
//Main
function ready(finance){
    const financeClean = filterData(finance);
    //console.log(financeClean);
    //const barchartdata=prebarchartdata(financeClean).sort(
        //(a,b) => {return d3.descending(a.稅後淨利,b.稅後淨利);
        //}
    //);
    const financeData = chooseData("營業收入", financeClean);
    console.log(financeData);
    setupCanvas(financeData,financeClean);
}

//Load Data
d3.csv('data/EPS.csv',type).then(
    res=>{
        //console.log('CSV:',res);
        ready(res);
        // debugger;
    }
)
function chooseData(metric, financeClean){
    const thisData = financeClean.sort((a,b)=>b[metric]-a[metric]).filter((d,i)=>i<1000);
    return thisData;
}

function formatTicks(d){
    return d3.format('~s')(d)
    .replace('M','mil')
    .replace('G','bil')
    .replace('T','tri')
}
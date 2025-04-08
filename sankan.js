let auto_save_enabled = false;
let ptable_active_range = 5;
let display_attr_count = 2;
let on_add_count = 2;
const create_sample_data = true;


let csv_file_handle = null;

// メンドイので、
// 友達リストのテーブルは ftable (friend table) と書く
// 参加者リストのテーブルは ptable (participant table) と書く
const ftable = document.createElement('table');
const ptable = document.createElement('table');


const create_button = (title, eh) => {
    const button = document.createElement('button');
    button.textContent = title;
    button.onclick = eh;
    return button;
}

const load_file_button = create_button('友達名簿読み込み', ()=>{load_file();});
const autosave_div = document.createElement('div');
const range_div = document.createElement('div');
const attrib_div = document.createElement('div');
const join_count_div = document.createElement('div');
const delete_attrib_name_input = document.createElement('input');

// 友達の情報一覧
const flist = [];
const flist_order = [];
const friend_attrib_list = [];

// flistのうち参加待機状態にいるものの情報
const plist = [];

// 扱う名簿のファイル種類
const csv_file_type = {
    types: [{
        description: 'CSV Files',
        accept: {
        'text/csv': ['.csv']
        }
    }]
};

const init = () => {
    // 友達名簿読み込みボタン
    document.body.appendChild(load_file_button);

    // オートセーブ
    set_autosave(auto_save_enabled);
    document.body.appendChild(autosave_div);

    // ファイル操作関連ボタン
    const file_action_div = document.createElement('div');
    file_action_div.appendChild(create_button('名前を付けて名簿を保存', ()=>{saveas_flist();}));
    file_action_div.appendChild(create_button('上書き保存', ()=>{save_flist();}));
    document.body.appendChild(file_action_div);

    //-----------------------------------------------------------------------------
    document.body.appendChild(document.createElement('hr'));
    
    // 友達リスト
    const ftable_title = document.createElement('div');
    ftable_title.textContent = '友達リスト';
    document.body.appendChild(ftable_title);

    document.body.appendChild(ftable);

    // 友達リスト操作関連ボタン
    const ftable_action_div = document.createElement('div');
    ftable_action_div.appendChild(create_button('新規の友達を追加', ()=>{add_new_friend();}));
    ftable_action_div.appendChild(create_button('新規の列を追加', ()=>{add_new_attrib();}));
    ftable_action_div.appendChild(create_button('名前を指定して列を削除', (e)=>{delete_attrib(delete_attrib_name_input.value);}));
    ftable_action_div.appendChild(delete_attrib_name_input);
    document.body.appendChild(ftable_action_div);

    //-----------------------------------------------------------------------------
    document.body.appendChild(document.createElement('hr'));

    // 同時参加できる数の設定
    add_range(0);
    document.body.appendChild(range_div);

    // 参加者テーブルに表示する友達の数
    add_attrib_count(0);
    document.body.appendChild(attrib_div);

    // 参加者テーブルに追加するときに付与するカウント
    add_join_count(0);
    document.body.appendChild(join_count_div);

    // 同時参加者のカウントを一つ減らすボタン
    document.body.appendChild(create_button('参加者のカウントを1減らす', (e)=>{range_dec();}));
    
    // カウントが0以下の参加者を削除するボタン
    document.body.appendChild(create_button('カウントが0以下の参加待機者を削除', (e)=>{delete_0();}));

    // 参加待機リスト
    const ptable_title = document.createElement('div');
    ptable_title.textContent = '参加待機リスト';
    document.body.appendChild(ptable_title);

    document.body.appendChild(ptable);


    // サンプルデータの登録操作
    if (create_sample_data) create_sample();


    // ファイルD&Dに対応
    document.ondragover = (e)=>{e.preventDefault();};
    document.ondrop = drop_file;

    
    // 両リストの構築
    build_ftable();
    build_ptable();
};



let ftable_dragging_row = -1;
let ftable_building = 0;

const build_ftable = () => {
    ++ftable_building;

    // 内容クリア
    if (ftable_building<2) while (ftable.rows.length > 0) ftable.deleteRow(0);

    for (let y = -1; y < flist.length; ++y) {
        const row = ftable.insertRow();
        
        // rowの設定
        if (y < 0) {
            // 先頭行はちょっと枠太く
            row.style.border = '2px solid';
        } else {
            // 2行目以降はD&Dで行を移動できるようにしておく
            row.draggable = true;
            row.ondragstart = (e)=>{document.ondrop=null;ftable_dragging_row=y;};
            row.ondragend = (e)=>{document.ondrop=drop_file;ftable_dragging_row=-1;}
            row.ondragenter = (e)=>{
                e.preventDefault();
                if (ftable_dragging_row >= 0) {
                    if (y < ftable_dragging_row) row.style.borderTop='3px solid';
                    if (y > ftable_dragging_row) row.style.borderBottom='3px solid';
                }
            };
            row.ondragleave = (e)=>{e.preventDefault();row.style.borderTop='';row.style.borderBottom='';};
            row.ondrop = (e)=>{e.preventDefault();if(ftable_dragging_row>=0)move_flist(ftable_dragging_row, y);};
        }

        // 先頭に追加する固定内容
        const add_cell = row.insertCell();
        if (y < 0) {
            add_cell.textContent = '待機追加';
        } else {
            const fi = flist_order[y];
            add_cell.appendChild(create_button('通常', (e)=>{add_plist(fi, false);}));
            add_cell.appendChild(create_button('優先', (e)=>{add_plist(fi, true);}));
        }
        const move_cell = row.insertCell();
        if (y < 0) {
            move_cell.textContent = '移動';
        } else {
            // move_cell.appendChild(create_button('↑', ()=>{move_flist(y, y-1);}));
            // move_cell.appendChild(create_button('↓', ()=>{move_flist(y, y+1);}));
            move_cell.style.textAlign = 'center';
            move_cell.textContent = '≡';
        }

        // 友達内容追加
        for (let x = 0; x < friend_attrib_list.length; ++x) {
            const cell = row.insertCell();
            // 編集可能にしておく
            cell.contentEditable = true;
            cell.spellcheck = false;
            // Enterキーを押したら改行させないで内容確定、ESCキーを押したら編集キャンセルにする
            cell.onkeydown = (e)=>{
                if (e.key === 'Enter') {
                    e.target.blur(); // 内容確定（というかフォーカスを外すだけ）
                    e.preventDefault(); // Enterキーを無効化
                }
                if (e.key === 'Escape') {
                    cell.textContent = (y<0?friend_attrib_list[x]:flist[flist_order[y]][friend_attrib_list[x]]) || '';  // ESCなら編集内容戻す
                    e.target.blur(); // フォーカスを外す
                }
            };
            if (y < 0) {
                cell.textContent = friend_attrib_list[x] + ' ';
                const lb = create_button('<', ()=>{cell.moved=true;swap_attrib(x, x-1);});
                const rb = create_button('>', ()=>{cell.moved=true;swap_attrib(x, x+1);});
                cell.appendChild(lb);
                cell.appendChild(rb);
                
                // フォーカスが外れるときに内容を反映
                cell.onblur = (e)=> {
                    if (!e.target.moved) {
                        const value = e.target.textContent.trim();
                        change_attrib(x, value); // 内容更新
                        build_ftable();
                        build_ptable();
                    }
                };
                cell.onclick = (e)=>{
                    // 末尾の' <>'を削除
                    cell.removeChild(lb);
                    cell.removeChild(rb);
                };
            } else {
                const fr = flist[flist_order[y]];
                const attr = friend_attrib_list[x];
                const value = fr[attr] || '';
                cell.textContent = value;

                // フォーカスが外れるときに内容を反映
                cell.onblur = (e)=> {
                    fr[attr] = e.target.textContent; // 内容更新
                    build_ftable();
                    build_ptable();
                    auto_save();
                };
            }
        }

        // 末尾に追加する固定内容
        const del_cell = row.insertCell();
        if (y < 0) {
            del_cell.textContent = '削除';
        } else {
            // const del_button = document.createElement('button');
            // del_button.textContent = '✖';
            // del_cell.appendChild(del_button);
            const fi = flist_order[y];
            del_cell.appendChild(create_button('✖', ()=>{delete_friend(fi)}));
        }
    }

    --ftable_building;
}


let ptable_dragging_row = -1;

const build_ptable = () => {
    // 内容クリア
    while (ptable.rows.length > 0) ptable.deleteRow(0);

    // テーブルの内容作成
    for (let y = -1; y < plist.length; ++y) {
        const row = ptable.insertRow();

        if (y < 0) {
            // 先頭行はちょっと枠太く
            row.style.border = '2px solid';
            row.ondragenter = (e)=>{
                e.preventDefault();
                // ftableからのD&Dも受け付ける
                if (ftable_dragging_row >= 0) row.style.borderBottom='3px solid';
            };
            row.ondragleave = (e)=>{e.preventDefault();row.style.borderBottom='';};
            row.ondrop = (e)=>{
                e.preventDefault();
                row.style.borderTop='';
                row.style.borderBottom='';
                // ftableからのD&Dも受け付ける
                if (ftable_dragging_row >= 0) add_plist_to(flist_order[ftable_dragging_row], y+1);
            };
        } else {
            // 2行目以降はD&Dで行を移動できるようにしておく
            row.draggable = true;
            row.ondragstart = (e)=>{document.ondrop=null;ptable_dragging_row=y;};
            row.ondragend = (e)=>{document.ondrop=drop_file;ptable_dragging_row=-1;}
            row.ondragenter = (e)=>{
                e.preventDefault();
                if (ptable_dragging_row >= 0) {
                    if (y < ptable_dragging_row) row.style.borderTop='3px solid';
                    if (y > ptable_dragging_row) row.style.borderBottom='3px solid';
                }
                // ftableからのD&Dも受け付ける
                if (ftable_dragging_row >= 0) row.style.borderBottom='3px solid';
            };
            row.ondragleave = (e)=>{e.preventDefault();row.style.borderTop='';row.style.borderBottom='';};
            row.ondrop = (e)=>{
                e.preventDefault();
                row.style.borderTop='';
                row.style.borderBottom='';
                if (ptable_dragging_row >= 0) move_plist(ptable_dragging_row, y);
                // ftableからのD&Dも受け付ける
                if (ftable_dragging_row >= 0) add_plist_to(flist_order[ftable_dragging_row], y+1);
            };
        }

        // 同時参加枠には色を塗っておく
        if (y >= 0 && y < ptable_active_range) {
            row.style.backgroundColor = 'yellow';
        }

        // 列の先頭に追加する固定内容
        const move_cell = row.insertCell();
        if (y < 0) {
            move_cell.textContent = '移動';
        } else {
            // move_cell.appendChild(create_button('↑', ()=>{move_plist(y, y-1);}));
            // move_cell.appendChild(create_button('↓', ()=>{move_plist(y, y+1);}));
            move_cell.style.textAlign = 'center';
            move_cell.textContent = '≡';
        }
        const count_cell = row.insertCell();
        if (y < 0) {
            count_cell .textContent = 'カウント';
        } else {
            count_cell.appendChild(create_button('＋', ()=>{add_count(y, 1);}));
            count_cell.appendChild(create_button('ー', ()=>{add_count(y, -1);}));
            count_cell.appendChild(document.createTextNode(' ' + plist[y].count));
        }
        const pref_cell = row.insertCell();
        if (y < 0) {
            pref_cell.textContent = '優先';
        } else {
            pref_cell.onclick = ()=>{
                if (plist[y].preferential) {
                    pref_cell.textContent = '';
                    plist[y].preferential = false;
                } else {
                    pref_cell.textContent = '〇';
                    plist[y].preferential = true;
                }
            };
            if (plist[y].preferential) pref_cell.textContent =  '〇';
        }

        // 友達内容
        for (x = 0; x < display_attr_count && x < friend_attrib_list.length; ++x) {
            const cell = row.insertCell();
            const attr = friend_attrib_list[x];
            if (y < 0) {
                cell.textContent = attr;
            } else {
                cell.textContent = flist[plist[y].friend_index][attr] || '';
            }
        }

        // 列末尾に追加する固定内容
        const del_cell = row.insertCell();
        if (y < 0) {
            del_cell.textContent = '削除';
        } else {
            del_cell.appendChild(create_button('✖', ()=>{delete_plist(y)}));
        }
    }

}


const set_autosave = (a) => {

    // 一旦消去
    autosave_div.textContent = '';

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = a;
    check.onclick = (e)=>{auto_save_enabled = e.target.checked;};

    autosave_div.appendChild(document.createTextNode(`自動セーブ `));
    autosave_div.appendChild(check);
}

const add_range = (n) => {
    ptable_active_range = Math.max(0, ptable_active_range + n);

    // 一旦消去
    range_div.textContent = '';

    range_div.appendChild(document.createTextNode(`同時参加: `));
    range_div.appendChild(create_button('＋', ()=>{add_range(1);}));
    range_div.appendChild(create_button('ー', ()=>{add_range(-1);}));
    range_div.appendChild(document.createTextNode(` ${ptable_active_range}`));

    build_ptable();
}

const add_attrib_count = (n) => {
    display_attr_count = Math.max(0, display_attr_count + n);

    // 一旦消去
    attrib_div.textContent = '';

    attrib_div.appendChild(document.createTextNode(`表示属性数: `));
    attrib_div.appendChild(create_button('＋', ()=>{add_attrib_count(1);}));
    attrib_div.appendChild(create_button('ー', ()=>{add_attrib_count(-1);}));
    attrib_div.appendChild(document.createTextNode(` ${display_attr_count}`));

    build_ptable();
}

const add_join_count = (n) => {
    on_add_count = Math.max(0, on_add_count + n);

    // 一旦消去
    join_count_div.textContent = '';

    join_count_div.appendChild(document.createTextNode(`追加時付与カウント: `));
    join_count_div.appendChild(create_button('＋', ()=>{add_join_count(1);}));
    join_count_div.appendChild(create_button('ー', ()=>{add_join_count(-1);}));
    join_count_div.appendChild(document.createTextNode(` ${on_add_count}`));
}

const move_plist = (from, to) => {
    if (from < 0 || from >= plist.length) return;
    if (to < 0 || to >= plist.length) return;

    const p = plist[from];
    plist.splice(from, 1);
    plist.splice(to, 0, p);

    build_ptable();
}

const add_count = (i, count) => {
    plist[i].count += count;

    build_ptable();
}

const range_dec = () => {
    // 最初のptable_active_range個のcountを減らす
    for (let i = 0; i < ptable_active_range && i < plist.length; ++i) --plist[i].count;

    build_ptable();
}

const delete_0 = () => {
    // カウントが0以下のものを削除
    for (let i = plist.length - 1; i >= 0; --i) if (plist[i].count <= 0) delete_plist(i);

    build_ptable();
}

const add_plist = (i, pref) => {
    let p = {
        friend_index : i,
        preferential : pref,
        count : on_add_count
    };

    if (pref) {
        // 優先の最後に追加
        let i = plist.length;
        while (i > 0) {
            if (plist[i-1].preferential || i == ptable_active_range) break;
            --i;
        }
        plist.splice(i, 0, p);
    } else {
        // 単純に最後に追加
        plist.push(p);
    }

    build_ptable();
}

const add_plist_to = (fi, pi) => {
    let p = {
        friend_index : fi,
        preferential : false,
        count : on_add_count
    };

    plist.splice(pi, 0, p);

    build_ptable();
}

const delete_plist = (i) => {
    if (i < 0 || i >= plist.length) return;
    plist.splice(i, 1);

    build_ptable();
}

const swap_attrib = (i, j) => {
    if (i < 0 || i >= friend_attrib_list.length) return;
    if (j < 0 || j >= friend_attrib_list.length) return;
    
    const l = Math.min(i, j);
    const h = Math.max(i, j);
    const a = friend_attrib_list[h];
    friend_attrib_list.splice(h, 1);
    friend_attrib_list.splice(l, 0, a);

    build_ftable();
    build_ptable();

    auto_save();
}

const move_flist = (from, to) => {
    if (from < 0 || from >= flist_order.length) return;
    if (to < 0 || to >= flist_order.length) return;

    const f = flist_order[from];
    flist_order.splice(from, 1);
    flist_order.splice(to, 0, f);

    build_ftable();

    auto_save();
}

const change_attrib = (i, value) => {
    const from = friend_attrib_list[i]; // 元のattrib名
    // 元のattrib名と同じなら何もしない
    if (value == from) return;
    // 空文字列なら何もしない
    if (value.length == 0) {alert('空文字列は指定できません');return;}
    // もしすでに存在するattribなら何もしない
    for (let j = 0; j < friend_attrib_list.length; ++j) if (friend_attrib_list[j] == value) {alert('重複する列名は指定できません');return;}

    // flistを一通り更新
    for (let j = 0; j < flist.length; ++j) {
        const fr = flist[j];
        fr[value] = fr[from];
        delete fr[from];
    }

    friend_attrib_list[i] = value;

    auto_save();
}


const parse_friend_csv = (data) => {
    const csv = [];

     // csv配列へ読み込み
    //----------------------
    const lines = data.split('\n'); // 行で分割
    for (let i = 0; i < lines.length; ++i) {
        if (lines[i].length == 0) break; // 空行回避
        const values = lines[i].trim().split(','); // ,で分割
        csv[i] = [];
        for (let j = 0; j < values.length; ++j) {
            csv[i][j] = values[j];
        }
    }

     // 内容を検証
    //-----------------
    // 一行も無かったら無効
    if (csv.length == 0) {alert('内容が無いよう');return false;}
    // 全部の行の列数が揃ってなかったら無効
    for (let i = 1; i < csv.length; ++i) if (csv[i].length != csv[0].length) {alert('列数の異なる行があります');return false;}
    // 一行目に空文字列があったら無効
    for (let i = 0; i < csv[0].length; ++i) if (csv[0][i].length == 0) {alert('空の列名があります');return false;}
    // 一行目に同じ内容の列があったら無効
    for (let i = 0; i < csv[0].length; ++i) if (csv[0].indexOf(csv[0][i]) != i) {alert('列名の重複があります');return false;}

    // flistとfriend_attrib_listを作り直し
    flist.splice(0, flist.length);
    friend_attrib_list.splice(0, friend_attrib_list.length);

     // csvからflistを作成する
    //----------------------------
    for (let y = 0; y < csv.length; ++y) {
        if (y == 0) {
            // csv[0]は属性名の羅列
            for (let x = 0; x < csv[0].length; ++x) friend_attrib_list[x] = csv[0][x];
        } else {
            // csv[1...]は各人のデータ
            flist[y-1] = {};
            for (let x = 0; x < csv[0].length; ++x) if (csv[y][x].length > 0) flist[y-1][friend_attrib_list[x]] = csv[y][x];
        }
    }

    // orderを作り直し
    flist_order.splice(0, flist_order.length);
    for (let i = 0; i < flist.length; ++i) flist_order[i] = i;

    // 参加者リストは消去
    plist.splice(0, plist.length);

    build_ftable();
    build_ptable();

    return true;
}

const build_friend_csv = () => {
    let content = '';

     // content内にCSVファイルの内容を作成
    //-------------------------------------

    // 1行目
    for (let x = 0; x < friend_attrib_list.length; ++x) {
        content += friend_attrib_list[x];
        if (x == friend_attrib_list.length - 1) {
            content += '\n';
        } else {
            content += ',';
        }
    }
    // flistの内容出力
    for (let i = 0; i < flist.length; ++i) {
        const f = flist[flist_order[i]];
        for (let a = 0; a < friend_attrib_list.length; ++a) {
            const value = f[friend_attrib_list[a]] || '';
            content += value;
            if (a == friend_attrib_list.length - 1) {
                content += '\n';
            } else {
                content += ',';
            }
        }
    }

    return content;
}

const add_new_friend = () => {
    flist.push({});
    flist_order.push(flist_order.length);

    build_ftable();
}

const delete_friend = (i) => {
    // i番目(ftableではなく、flistのインデクス！)の友達を削除する
    flist.splice(i, 1);

    // flist_orderの調整
    // インデクスが等しければ削除、大きければひとつ減らす
    for (let j = flist_order.length - 1; j >= 0; --j) {
        if (flist_order[j] == i) flist_order.splice(j, 1);
        else
        if (flist_order[j] > i) --flist_order[j];
    }

    // plistに削除された人がいたら取り除いておく
    // flistへのインデクスも修正する
    for (let j = plist.length - 1; j >= 0; --j) {
        if (plist[j].friend_index == i) plist.splice(j, 1);
        else
        if (plist[j].friend_index > i) --plist[j].friend_index;
    }

    build_ftable();
    build_ptable();

    auto_save();
}

const add_new_attrib = () => {
    let attrib_name = 'new attrib';

    let count = 1;
    let found;
    do {
        found = false;
        for (let i = 0; i < friend_attrib_list.length; ++i) {
            if (friend_attrib_list[i] == attrib_name) {
                found = true;
                attrib_name = 'new attrib ' + count++;
                break;
            }
        }
    } while (found);

    friend_attrib_list.push(attrib_name);

    build_ftable();
}

const delete_attrib = (name)=>{
    for (let i = 0; i < friend_attrib_list.length; ++i) {
        if (friend_attrib_list[i] == name) {
            friend_attrib_list.splice(i, 1);
            break;
        }
    }

    build_ftable();

    auto_save();
}

const load_file = async () => {
    const [fhandle] = await window.showOpenFilePicker(csv_file_type);
    const file = await fhandle.getFile();
    const content = await file.text();

    if (!parse_friend_csv(content)) return;

    // 読み込んだファイルのハンドルは保持しておく
    csv_file_handle = fhandle;
    load_file_button.textContent = fhandle.name;
}


const drop_file = async (ev)=>{
    ev.preventDefault();
    const [item] = ev.dataTransfer.items;
    if (item.kind != 'file') {alert('CSVファイルをD&Dしてください');return;}
    const fhandle = await item.getAsFileSystemHandle();
    if (fhandle.kind != 'file') {alert('CSVファイルをD&Dしてください');return;}
    if (!fhandle.name.endsWith('.csv') && !fhandle.name.endsWith('.CSV')) {alert('CSVファイルをD&Dしてください');return;}
    
    const file = await fhandle.getFile();
    const content = await file.text();

    if (!parse_friend_csv(content)) return;

    // 読み込んだファイルのハンドルは保持しておく
    csv_file_handle = fhandle;
    load_file_button.textContent = fhandle.name;
}

const saveas_flist = async () => {
    const content = build_friend_csv();

    // ファイル取得
    const fhandle = await window.showSaveFilePicker(csv_file_type);
    // 書き込み
    const writable = await fhandle.createWritable();
    await writable.write(content);
    await writable.close();

    csv_file_handle = fhandle;
    load_file_button.textContent = fhandle.name;
}

const save_flist = async () => {
    // ファイル取得
    if (csv_file_handle) {
        const content = build_friend_csv();

        // 書き込み
        const writable = await csv_file_handle.createWritable();
        await writable.write(content);
        await writable.close();
    }
}

const auto_save = () => {
    if (auto_save_enabled) save_flist();
}

const create_sample = () => {
    // とりあえず列を六つ追加
    add_new_attrib();
    add_new_attrib();
    add_new_attrib();
    add_new_attrib();
    add_new_attrib();
    add_new_attrib();
    // 列の名前を登録
    change_attrib(0, 'twitch名');
    change_attrib(1, 'ゲーム1内の名前');
    change_attrib(2, 'ゲーム2内の名前');
    change_attrib(3, 'twitterアカウント');
    change_attrib(4, 'BattleTag');
    change_attrib(5, 'SteamID');
    // 友達を7～9人ほど追加しておく
    const f = 7 + Math.trunc(Math.random()*3);
    for (let i = 0; i < f; ++i) add_new_friend();
    // 各データを適当に登録
    for (let i = 0; i < f; ++i) {
        for (let j = 0; j < 6; ++j) {
            switch (j) {
                default: value = '';break;
                case 0: value = 'つい'+(i+1)+'っち';break;
                case 1: case 2: value = 'ゲ'+j+'ーマー'+(i+1);break;
                case 3: value = '@account_name_'+(i+1);break;
                case 4: value = 'ゲーマー#'+Math.trunc(Math.random()*9999);break;
                case 5: value = Math.trunc(Math.random()*4200000000);break;
            }
            flist[i][friend_attrib_list[j]] = value;
        }
    }
    // 友達を参加待機リストに追加
    const n = 7 + Math.trunc(Math.random()*5);
    for (let i = 0; i < n; ++i) add_plist(Math.trunc(Math.random()*7), Math.random() < 0.3);
}


window.onload = () => {init();};

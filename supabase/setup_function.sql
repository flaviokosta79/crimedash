-- Criar função para inserir crimes
CREATE OR REPLACE FUNCTION insert_crime(
    crime_data jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Isso faz a função rodar com as permissões do owner
SET search_path = public
AS $$
BEGIN
    -- Inserir o crime
    INSERT INTO crimes (
        seq,
        seq_bo,
        ano_bo,
        data_fato,
        hora_fato,
        data_comunicacao,
        titulo_do_delito,
        tipo_do_delito,
        indicador_estrategico,
        fase_divulgacao,
        dia_semana,
        aisp,
        risp,
        municipio,
        bairro,
        faixa_horario
    ) VALUES (
        (crime_data->>'seq')::integer,
        (crime_data->>'seq_bo')::integer,
        (crime_data->>'ano_bo')::integer,
        (crime_data->>'data_fato')::date,
        (crime_data->>'hora_fato')::time,
        (crime_data->>'data_comunicacao')::date,
        crime_data->>'titulo_do_delito',
        crime_data->>'tipo_do_delito',
        crime_data->>'indicador_estrategico',
        crime_data->>'fase_divulgacao',
        crime_data->>'dia_semana',
        crime_data->>'aisp',
        crime_data->>'risp',
        crime_data->>'municipio',
        crime_data->>'bairro',
        crime_data->>'faixa_horario'
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Dar permissão para o service_role executar a função
GRANT EXECUTE ON FUNCTION insert_crime(jsonb) TO service_role;

-- Criar função para inserir série temporal
CREATE OR REPLACE FUNCTION insert_timeseries(
    timeseries_data jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Inserir a série temporal
    INSERT INTO crime_timeseries (
        date,
        unit,
        count
    ) VALUES (
        (timeseries_data->>'date')::date,
        timeseries_data->>'unit',
        (timeseries_data->>'count')::integer
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Dar permissão para o service_role executar a função
GRANT EXECUTE ON FUNCTION insert_timeseries(jsonb) TO service_role;
